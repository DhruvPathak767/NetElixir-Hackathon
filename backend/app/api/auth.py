from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, ChangePasswordRequest
from app.services.auth_service import AuthService
from app.security import create_access_token

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user. Performs email format validation, checks uniqueness,
    verifies password strength, and confirms password equality.
    """
    db_user = await AuthService.register_user(db, user_data)
    user_response = UserResponse.model_validate(db_user)
    return {
        "success": True,
        "message": "User registered successfully",
        "user": user_response
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates user credentials and returns a secure JWT access token.
    """
    db_user = await AuthService.authenticate_user(db, credentials.email, credentials.password)
    access_token = create_access_token(subject=db_user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the currently authenticated user.
    """
    return current_user

@router.put("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Changes the authenticated user's password. Requires valid current password and strong new password.
    """
    db_user = await AuthService.change_password(db, current_user, data)
    user_response = UserResponse.model_validate(db_user)
    return {
        "success": True,
        "message": "Password updated successfully",
        "user": user_response
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logs out the user. Since JWT is stateless, we simply return a confirmation message.
    """
    return {
        "success": True,
        "message": "Logged out successfully"
    }
