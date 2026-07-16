from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Self, Optional, Dict, Any

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(...)
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    confirm_password: str = Field(..., min_length=8)

    @model_validator(mode="after")
    def passwords_match(self) -> Self:
        if self.password != self.confirm_password:
            raise ValueError("passwords do not match")
        return self

class PasswordGenericResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
