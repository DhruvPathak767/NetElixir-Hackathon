from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, func
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    role = Column(String, default="user", nullable=False)
    company = Column(String, nullable=True)
    notifications = Column(JSON, nullable=True)
    integrations = Column(JSON, nullable=True)
    
    # Google OAuth & Password Reset fields
    google_id = Column(String, unique=True, nullable=True)
    profile_picture = Column(String, nullable=True)
    provider = Column(String, default="LOCAL", nullable=False)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
