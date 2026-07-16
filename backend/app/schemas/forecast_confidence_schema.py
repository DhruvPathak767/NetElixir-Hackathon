"""
Forecast Confidence Schema — app/schemas/forecast_confidence_schema.py
=====================================================================

Pydantic schemas for the Forecast Confidence API (POST /forecast-confidence).
"""

from __future__ import annotations

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, AliasChoices, field_validator, model_validator

from app.core import config
from app.schemas.envelope_schema import StandardEnvelopeResponse


class ForecastConfidenceRequest(BaseModel):
    """Request schema for campaign forecasting with confidence, supporting lowercase/uppercase fields and strict validation rules."""

    Google_Spend: float = Field(
        ...,
        validation_alias=AliasChoices("google_spend", "Google_Spend"),
        serialization_alias="google_spend",
        ge=0.0,
        description="Google Ads spend (non-negative)."
    )
    Meta_Spend: float = Field(
        ...,
        validation_alias=AliasChoices("meta_spend", "Meta_Spend"),
        serialization_alias="meta_spend",
        ge=0.0,
        description="Meta Ads spend (non-negative)."
    )
    Microsoft_Spend: float = Field(
        ...,
        validation_alias=AliasChoices("microsoft_spend", "Microsoft_Spend"),
        serialization_alias="microsoft_spend",
        ge=0.0,
        description="Microsoft Ads spend (non-negative)."
    )
    Clicks: int = Field(
        ...,
        validation_alias=AliasChoices("clicks", "Clicks"),
        serialization_alias="clicks",
        ge=0,
        description="Clicks generated (non-negative)."
    )
    Impressions: int = Field(
        ...,
        validation_alias=AliasChoices("impressions", "Impressions"),
        serialization_alias="impressions",
        ge=0,
        description="Impressions generated (non-negative)."
    )
    Conversions: int = Field(
        ...,
        validation_alias=AliasChoices("conversions", "Conversions"),
        serialization_alias="conversions",
        ge=0,
        description="Conversions generated (non-negative)."
    )
    Campaign_Type: str = Field(
        ...,
        validation_alias=AliasChoices("campaign_type", "Campaign_Type"),
        serialization_alias="campaign_type",
        description="Campaign type channel."
    )
    Region: str = Field(
        ...,
        validation_alias=AliasChoices("region", "Region"),
        serialization_alias="region",
        description="Target geographical region."
    )
    Date: Optional[str] = Field(
        "2026-07-16",
        validation_alias=AliasChoices("date", "Date"),
        serialization_alias="date",
        description="Forecast target date in YYYY-MM-DD format."
    )
    CTR: Optional[float] = Field(
        None,
        validation_alias=AliasChoices("ctr", "CTR"),
        serialization_alias="ctr",
        description="Click Through Rate."
    )
    CPC: Optional[float] = Field(
        None,
        validation_alias=AliasChoices("cpc", "CPC"),
        serialization_alias="cpc",
        description="Cost Per Click."
    )
    CPM: Optional[float] = Field(
        None,
        validation_alias=AliasChoices("cpm", "CPM"),
        serialization_alias="cpm",
        description="Cost Per Mille."
    )

    model_config = {
        "populate_by_name": True
    }

    @field_validator("Campaign_Type")
    @classmethod
    def validate_campaign_type(cls, v: str) -> str:
        if v not in config.ALLOWED_CAMPAIGN_TYPES:
            raise ValueError(f"Invalid Campaign_Type. Must be one of {config.ALLOWED_CAMPAIGN_TYPES}")
        return v

    @field_validator("Region")
    @classmethod
    def validate_region(cls, v: str) -> str:
        if v not in config.ALLOWED_REGIONS:
            raise ValueError(f"Invalid Region. Must be one of {config.ALLOWED_REGIONS}")
        return v

    @field_validator("Date")
    @classmethod
    def validate_date(cls, v: Optional[str]) -> Optional[str]:
        if v:
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError("Date must be a valid ISO date in YYYY-MM-DD format.")
        return v

    @model_validator(mode="after")
    def validate_metrics_constraints(self) -> ForecastConfidenceRequest:
        # No zero total budget
        total_spend = self.Google_Spend + self.Meta_Spend + self.Microsoft_Spend
        if total_spend <= 0.0:
            raise ValueError("Total campaign spend across all channels (Google, Meta, Microsoft) must be greater than zero.")
        
        # Clicks <= Impressions
        if self.Clicks > self.Impressions:
            raise ValueError(f"Clicks ({self.Clicks}) cannot exceed impressions ({self.Impressions}).")
        
        # Conversions <= Clicks
        if self.Conversions > self.Clicks:
            raise ValueError(f"Conversions ({self.Conversions}) cannot exceed clicks ({self.Clicks}).")
            
        return self


class ModelMetrics(BaseModel):
    """Predictive model performance evaluation metrics."""

    r2: float = Field(..., description="Test R2 score.")
    mape: float = Field(..., description="Model Mean Absolute Percentage Error.")
    cross_validation_r2: float = Field(..., description="Cross validation mean R2 score.")


class ForecastConfidenceResponse(BaseModel):
    """Response payload schema containing forecasting metrics and confidence indicators."""

    predicted_revenue: float = Field(..., description="Predicted Revenue.")
    predicted_roas: float = Field(..., description="Predicted Return on Ad Spend.")
    confidence_score: int = Field(..., description="Confidence score (0-100).")
    confidence_level: str = Field(..., description="Confidence rating level (Excellent, High, Good, Moderate, Low).")
    confidence_interval: str = Field(..., description="Confidence interval range (e.g. ±16%).")
    forecast_reliability: str = Field(..., description="Forecast reliability tier (Very High, High, Medium, Low).")
    model_metrics: ModelMetrics = Field(..., description="Accuracy metrics.")
    model_version: str = Field(..., description="Version of the predictive model.")


class ForecastConfidenceEnvelopeResponse(StandardEnvelopeResponse):
    """Enveloped response schema for Forecast Confidence API."""

    data: ForecastConfidenceResponse = Field(..., description="Confidence forecast data payload.")
