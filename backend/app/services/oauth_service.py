import secrets
import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from itsdangerous import URLSafeSerializer

from app.core.config import settings
from app.models.user import User
from app.security import get_password_hash
from app.logger import logger

class OAuthService:
    @staticmethod
    def get_serializer() -> URLSafeSerializer:
        return URLSafeSerializer(settings.SECRET_KEY)

    @staticmethod
    def generate_google_login_url() -> str:
        """
        Generates the Google OAuth 2.0 Consent Screen redirect URL with a secure state parameter.
        """
        serializer = OAuthService.get_serializer()
        state = serializer.dumps({"purpose": "google_login", "nonce": secrets.token_hex(16)})
        
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "prompt": "select_account"
        }
        
        # Build query string
        query_string = "&".join(f"{key}={value}" for key, value in params.items())
        return f"{base_url}?{query_string}"

    @staticmethod
    async def verify_state(state: str) -> None:
        """
        Verifies that the state parameter returned by Google is valid.
        """
        if not state:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OAuth state parameter is missing."
            )
        try:
            serializer = OAuthService.get_serializer()
            data = serializer.loads(state)
            if data.get("purpose") != "google_login":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid OAuth state purpose."
                )
        except Exception as e:
            logger.error(f"OAuth state verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OAuth state parameter is invalid or expired."
            )

    @staticmethod
    async def exchange_code_and_get_profile(code: str) -> dict:
        """
        Exchanges the authorization code for Google tokens and retrieves the verified profile information.
        """
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization code is missing."
            )
            
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(token_url, data=data)
                if response.status_code != 200:
                    logger.error(f"Google code exchange failed: {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to exchange authorization code with Google."
                    )
                
                token_data = response.json()
                id_token = token_data.get("id_token")
                if not id_token:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Google token response did not include id_token."
                    )
                
                # Verify token with Google tokeninfo endpoint
                info_url = "https://oauth2.googleapis.com/tokeninfo"
                info_response = await client.get(info_url, params={"id_token": id_token})
                if info_response.status_code != 200:
                    logger.error(f"Google tokeninfo validation failed: {info_response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to verify Google ID token."
                    )
                
                profile = info_response.json()
                
                # Crucial security check: verify audience
                aud = profile.get("aud")
                if aud != settings.GOOGLE_CLIENT_ID:
                    logger.error(f"Audience mismatch: expected {settings.GOOGLE_CLIENT_ID}, got {aud}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Google token audience verification failed."
                    )
                    
                return profile
            except httpx.HTTPError as e:
                logger.error(f"HTTP communication with Google failed: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to communicate with Google authentication services."
                )

    @staticmethod
    async def authenticate_or_create_user(db: Session, profile: dict) -> User:
        """
        Authenticates a user based on Google profile info. If the user already exists, links
        the account. Otherwise, automatically creates a new account.
        """
        google_id = profile.get("sub")
        email = profile.get("email")
        full_name = profile.get("name") or profile.get("given_name", "Google User")
        profile_picture = profile.get("picture")

        if not google_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incomplete user profile received from Google."
            )

        # 1. Search by google_id
        user = db.query(User).filter(User.google_id == google_id).first()
        
        # 2. Search by email if not found by google_id
        if not user:
            user = db.query(User).filter(User.email == email).first()
            if user:
                # Link Google account to existing local account
                logger.info(f"Linking Google account to existing user with email: {email}")
                user.google_id = google_id
                if not user.profile_picture:
                    user.profile_picture = profile_picture
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                # Create a new user with google details
                logger.info(f"Automatically creating user for Google email: {email}")
                random_password = secrets.token_hex(32)
                hashed_pw = get_password_hash(random_password)
                
                user = User(
                    full_name=full_name,
                    email=email,
                    password_hash=hashed_pw,
                    google_id=google_id,
                    profile_picture=profile_picture,
                    provider="GOOGLE",
                    is_active=True,
                    is_verified=True,
                    role="user"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is deactivated."
            )
            
        return user
