"""
Forecast Schema — app/schemas/forecast_schema.py
=================================================

Pydantic schemas for request validation and response serialization.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    """Request body schema containing a single campaign for prediction."""
    model_config = {
        "extra": "allow"
    }

    Google_Spend: float = Field(default=0.0, description="Google Ads spend (non-negative).")
    Meta_Spend: float = Field(default=0.0, description="Meta Ads spend (non-negative).")
    Microsoft_Spend: float = Field(default=0.0, description="Microsoft Ads spend (non-negative).")
    Clicks: int = Field(..., description="Clicks generated (non-negative).")
    Impressions: int = Field(..., description="Impressions generated (non-negative).")
    Conversions: int = Field(..., description="Conversions generated (non-negative).")
    Campaign_Type: str = Field(..., description="Campaign type channel.")
    Region: str = Field(..., description="Target geographical region.")
    Date: str = Field(..., description="Forecast target date in YYYY-MM-DD format.")


class ForecastResponse(BaseModel):
    """Response body schema for prediction output."""

    success: bool = Field(..., description="Success indicator.")
    predicted_revenue: float = Field(..., description="Predicted Revenue (rounded to 2 decimals).")
    total_spend: float = Field(..., description="Total marketing spend across all channels.")
    predicted_roas: float = Field(..., description="Predicted Return on Ad Spend (rounded to 2 decimals).")
    prediction_time_ms: float = Field(..., description="Prediction latency in milliseconds.")
    model_version: str = Field(..., description="Model version used for prediction.")
    available_channels: list[str] = Field(default_factory=list, description="Discovered advertising channels.")
