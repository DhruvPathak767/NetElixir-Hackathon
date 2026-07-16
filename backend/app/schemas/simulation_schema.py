"""
Simulation Schema — app/schemas/simulation_schema.py
=====================================================

Pydantic schemas for the POST /simulate endpoint, containing request and response
validation models and Swagger documentation request examples.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class SimulationRequest(BaseModel):
    """Request body schema for predicting campaign revenue with spend scenarios."""
    model_config = {
        "extra": "allow",
        "json_schema_extra": {
            "example": {
                "google_spend": 60000,
                "meta_spend": 30000,
                "microsoft_spend": 10000,
                "clicks": 7200,
                "impressions": 180000,
                "conversions": 620,
                "campaign_type": "Performance",
                "region": "North",
                "month": 8,
                "day": 15,
                "day_of_week": 2,
                "is_weekend": 0,
            }
        }
    }

    google_spend: float = Field(default=0.0, description="Google Ads scenario spend.")
    meta_spend: float = Field(default=0.0, description="Meta Ads scenario spend.")
    microsoft_spend: float = Field(default=0.0, description="Microsoft Ads scenario spend.")
    clicks: int = Field(..., description="Hypothetical clicks scenario.")
    impressions: int = Field(..., description="Hypothetical impressions scenario.")
    conversions: int = Field(..., description="Hypothetical conversions scenario.")
    campaign_type: str = Field(..., description="Target campaign channel.")
    region: str = Field(..., description="Scenario target region.")
    month: int = Field(..., description="Month of campaign (1-12).")
    day: int = Field(..., description="Day of campaign (1-31).")
    day_of_week: int = Field(..., description="Day of week (0=Monday, 6=Sunday).")
    is_weekend: int = Field(..., description="Is weekend indicator (0 or 1).")


class SimulationResponse(BaseModel):
    """Response body schema returning simulated forecast outcomes."""

    success: bool = Field(..., description="Success indicator.")
    predicted_revenue: float = Field(..., description="Simulated predicted Revenue (rounded to 2 decimals).")
    total_spend: float = Field(..., description="Simulated total campaign spend across channels.")
    predicted_roas: float = Field(..., description="Simulated Return on Ad Spend (rounded to 2 decimals).")
    estimated_profit: float = Field(..., description="Simulated Revenue increase over spend (Profit).")
    prediction_time_ms: float = Field(..., description="Latency of the prediction execution in milliseconds.")
    model_version: str = Field(..., description="Trained model version used.")
    available_channels: list[str] = Field(default_factory=list, description="Discovered advertising channels.")
