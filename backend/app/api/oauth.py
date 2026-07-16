from fastapi import APIRouter, Depends, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.dependencies import get_db
from app.services.oauth_service import OAuthService
from app.schemas.oauth import OAuthLoginResponse, OAuthTokenData
from app.schemas.auth import UserResponse
from app.security import create_access_token

router = APIRouter()

@router.get("/google/login", status_code=status.HTTP_307_TEMPORARY_REDIRECT)
async def google_login():
    """
    Redirects the user's browser to the Google OAuth 2.0 Consent Screen.
    """
    redirect_url = OAuthService.generate_google_login_url()
    return RedirectResponse(url=redirect_url)

@router.get("/google/callback", response_model=OAuthLoginResponse)
async def google_callback(
    code: str,
    state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Handles the Google OAuth redirect callback. Verifies OAuth state, exchanges authorization
    code, authenticates (or registers) the user, and returns a secure JWT access token.
    """
    # 1. Verify OAuth State parameter to prevent CSRF attacks
    await OAuthService.verify_state(state)
    
    # 2. Exchange code for user details
    profile = await OAuthService.exchange_code_and_get_profile(code)
    
    # 3. Create or login the user
    user = await OAuthService.authenticate_or_create_user(db, profile)
    
    # 4. Generate access token
    access_token = create_access_token(subject=user.email)
    
    user_response = UserResponse.model_validate(user)
    
    return {
        "success": True,
        "message": "Google login successful",
        "data": OAuthTokenData(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    }
