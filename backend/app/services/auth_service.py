import re
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import UserCreate, ChangePasswordRequest
from app.security import get_password_hash, verify_password

class AuthService:
    @staticmethod
    async def get_user_by_email(db: Session, email: str) -> User:
        """
        Retrieves a user by email from the database.
        """
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    async def register_user(db: Session, user_data: UserCreate) -> User:
        """
        Registers a new user after validating password strength and email uniqueness.
        """
        # Validate unique email
        existing_user = await AuthService.get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered"
            )
        
        # Validate password strength
        password = user_data.password
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        if not re.search(r"[A-Z]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one uppercase letter"
            )
        if not re.search(r"[0-9]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one number"
            )
        if not re.search(r"[^A-Za-z0-9]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one special character"
            )

        # Hash and store user
        hashed_password = get_password_hash(password)
        db_user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            password_hash=hashed_password,
            is_active=True,
            is_verified=False,
            role="user"
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    async def authenticate_user(db: Session, email: str, password: str) -> User:
        """
        Authenticates a user, checking password hash and account active status.
        """
        user = await AuthService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is deactivated"
            )
            
        return user

    @staticmethod
    async def change_password(db: Session, user: User, data: ChangePasswordRequest) -> User:
        """
        Updates a user's password after verifying the old password and checking new password complexity.
        """
        if not verify_password(data.old_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password"
            )
        
        password = data.new_password
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 8 characters"
            )
        if not re.search(r"[A-Z]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must contain at least one uppercase letter"
            )
        if not re.search(r"[0-9]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must contain at least one number"
            )
        if not re.search(r"[^A-Za-z0-9]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must contain at least one special character"
            )
            
        user.password_hash = get_password_hash(password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
