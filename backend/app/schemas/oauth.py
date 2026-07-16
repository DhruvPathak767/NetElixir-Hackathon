from pydantic import BaseModel
from app.schemas.auth import UserResponse

class OAuthTokenData(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class OAuthLoginResponse(BaseModel):
    success: bool
    message: str
    data: OAuthTokenData
