from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.services.password_service import PasswordService
from app.schemas.password import ForgotPasswordRequest, ResetPasswordRequest, PasswordGenericResponse

router = APIRouter()

@router.post("/forgot-password", response_model=PasswordGenericResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Initiates the forgot password flow. Generates a reset token and sends an email.
    Always returns a generic success response to protect user privacy.
    """
    await PasswordService.process_forgot_password(db, data.email)
    return {
        "success": True,
        "message": "If the email is registered, a password reset link has been sent.",
        "data": {}
    }

@router.get("/reset-password/{token}", response_model=PasswordGenericResponse)
async def validate_reset_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Validates a password reset token. Returns token validity status and email.
    """
    user = await PasswordService.validate_reset_token(db, token)
    return {
        "success": True,
        "message": "The reset token is valid.",
        "data": {
            "email": user.email
        }
    }

@router.post("/reset-password", response_model=PasswordGenericResponse)
async def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Completes the password reset process by verifying the token, validating
    password complexity, hashing the new password, and invalidating the token.
    """
    await PasswordService.reset_password(db, data.token, data.password)
    return {
        "success": True,
        "message": "Your password has been successfully reset.",
        "data": {}
    }
