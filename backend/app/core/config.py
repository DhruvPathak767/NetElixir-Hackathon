"""
System Configuration — app/core/config.py
=========================================

Central repository for platform-wide constants, model versions,
confidence thresholds, and rolling history capacity limits.
"""

from __future__ import annotations
import os
import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# API and Model Versions
API_VERSION: str = "v1"
MODEL_VERSION: str = "v3"

# Confidence Score Thresholds and Rating Tiers
CONFIDENCE_THRESHOLDS: dict[str, int] = {
    "EXCELLENT": 90,
    "HIGH": 80,
    "GOOD": 70,
    "MODERATE": 60
}

# Reliability Rating Tiers (R2 Bounds)
RELIABILITY_THRESHOLDS: dict[str, float] = {
    "VERY_HIGH": 0.90,
    "HIGH": 0.85,
    "MEDIUM": 0.75
}

# Rolling History Capacity Limits
HISTORY_LIMITS: dict[str, int] = {
    "MAX_RECOMMENDATIONS_HISTORY": 50,
    "MAX_PREDICTION_HISTORY": 1000
}

# Validation Constants
ALLOWED_CAMPAIGN_TYPES: list[str] = [
    "Awareness", "Brand", "Lead Generation", "Performance", "Remarketing", "Shopping", "Video"
]

# Allowed Regions
ALLOWED_REGIONS: list[str] = [
    "Central", "East", "North", "South", "West"
]


class Settings(BaseSettings):
    app_name: str = "Marketing Forecast API"
    app_version: str = "1.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./forecastiq.db"
    
    # Keys
    SECRET_KEY: str = "9e884e93d938b81a812dfb15802111d4d8ef82c2198083811802a243b8110a30"
    MISTRAL_API_KEY: str = ""
    
    # Google OAuth Settings
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/login"
    
    # SMTP Mail Settings
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "aicodelens@gmail.com"
    
    # Folders
    REPORT_FOLDER: str = "reports"
    UPLOAD_FOLDER: str = "uploads"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # CORS Origins
    ALLOWED_ORIGINS: Union[str, List[str]] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return [v]
            return v
        return v

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
