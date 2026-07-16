"""
Recommendation Schema — app/schemas/recommendation_schema.py
===========================================================

Pydantic schemas for the GET /ai-recommendations endpoint and its history.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field, ConfigDict


class BusinessHealth(BaseModel):
    """Aggregate business health indicators."""

    score: int = Field(..., description="Overall health score (0-100).")
    rating: str = Field(..., description="Overall rating (Excellent, Good, Average, Poor).")


class ForecastReliability(BaseModel):
    """Forecast reliability indicators."""

    rating: str = Field(..., description="Reliability tier (Very High, High, Medium, Low).")
    cross_validation_r2: float = Field(..., description="Mean R2 score from cross-validation.")
    mape: float = Field(..., description="Mean Absolute Percentage Error.")
    confidence_interval: str = Field(..., description="Confidence interval range (e.g. ±16%).")


class EstimatedGain(BaseModel):
    """Dynamically calculated financial gain projections."""

    revenue: str = Field(..., description="Estimated revenue change (e.g. +₹540000).")
    profit: str = Field(..., description="Estimated profit change (e.g. +₹420000).")
    roas: str = Field(..., description="Estimated ROAS change (e.g. +0.31).")


class KPIImpact(BaseModel):
    """Specific key performance indicator changes."""
    model_config = ConfigDict(populate_by_name=True)

    revenue: str = Field(..., alias="Revenue", description="Estimated revenue shift percentage.")
    roas: str = Field(..., alias="ROAS", description="Estimated absolute ROAS shift.")
    ctr: str = Field(..., alias="CTR", description="Estimated CTR shift.")
    conversion_rate: str = Field(..., alias="Conversion Rate", description="Estimated conversion rate shift.")


class RecommendationItem(BaseModel):
    """Actionable campaign recommendation."""

    id: int = Field(..., description="Unique recommendation ID.")
    title: str = Field(..., description="Short title of the recommendation.")
    category: str = Field(..., description="Marketing category (e.g. Budget, Campaign).")
    description: str = Field(..., description="Detailed text explanation.")
    priority: str = Field(..., description="Priority tier (High, Medium, Low).")
    confidence: int = Field(..., description="Confidence score as a percentage.")
    expected_business_impact: str = Field(..., description="Text description of the financial or ROI impact.")
    recommendation_score: int = Field(..., description="Weighted priority score (0-100).")

    # Upgraded AI Recommendation Engine fields
    forecast_reliability: ForecastReliability = Field(..., description="Reliability details for the recommendation's model forecast.")
    why_this_recommendation: str = Field(..., description="Detailed reasoning explaining why this recommendation was made.")
    estimated_gain: EstimatedGain = Field(..., description="Dynamically calculated financial gain projections.")
    action: str = Field(..., description="Strategic action type (e.g. Increase Budget, Optimize).")
    implementation: str = Field(..., description="Implementation difficulty tier (Easy, Medium, Complex).")

    # Enterprise Decision Support fields
    time_to_implement: str = Field(..., description="Expected timeline to implement the change.")
    estimated_cost: str = Field(..., description="Expected business cost tier (Low, Medium, High).")
    kpi_impact: KPIImpact = Field(..., description="Dynamic KPI improvements projected from implementation.")
    tags: list[str] = Field(..., description="Descriptive labels for categorizing/filtering.")
    because: list[str] = Field(..., description="Explanatory list of reasons justifying the recommendation.")


class RiskAlertItem(BaseModel):
    """Critical risk alert diagnostic."""

    title: str = Field(..., description="Risk alert title.")
    severity: str = Field(..., description="Risk severity tier (High, Medium, Low).")
    description: str = Field(..., description="Description of the risk alert.")


class GrowthOpportunityItem(BaseModel):
    """Prioritized growth area opportunity."""

    area: str = Field(..., description="Expansion area or channel name.")
    potential: str = Field(..., description="Yield potential level (High, Medium, Low).")
    expected_gain: str = Field(..., description="Expected percentage gain (e.g. 8%).")


class RecommendationSummary(BaseModel):
    """Summary counts of recommendations by priority category."""

    total_recommendations: int = Field(..., description="Total count of recommendations.")
    high_priority: int = Field(..., description="Count of High priority recommendations.")
    medium_priority: int = Field(..., description="Count of Medium priority recommendations.")
    low_priority: int = Field(..., description="Count of Low priority recommendations.")


class ResponseMetadata(BaseModel):
    """Standardized response metadata tracking execution parameters."""

    engine: str = Field(..., description="Recommendation engine name.")
    version: str = Field(..., description="Engine implementation version.")
    generated_at: str = Field(..., description="ISO 8601 generation timestamp.")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds.")
    model_version: str = Field(..., description="Version of the predictive model.")


class AIRecommendationsResponse(BaseModel):
    """Enterprise recommendation engine response structure."""

    success: bool = Field(..., description="Success indicator.")
    business_health: BusinessHealth = Field(..., description="Overall business health overview.")
    executive_summary: str = Field(..., description="Executive summary paragraph for C-level leadership.")
    recommendations: list[RecommendationItem] = Field(..., description="Ranked marketing recommendations.")
    risk_alerts: list[RiskAlertItem] = Field(..., description="List of active risk alerts.")
    growth_opportunities: list[GrowthOpportunityItem] = Field(..., description="Growth opportunities list.")
    next_best_action: str = Field(..., description="The single next best marketing action recommendation.")
    processing_time_ms: float = Field(..., description="The time taken to generate recommendations in milliseconds.")

    # Processing Metadata
    generated_at: str = Field(..., description="ISO 8601 timestamp of when recommendations were generated.")
    model_version: str = Field(..., description="The version of the machine learning model used.")
    optimization_version: str = Field(..., description="The version of the optimization algorithm used.")

    # Enterprise Extensions
    summary: RecommendationSummary = Field(..., description="High-level counts of generated recommendations by priority.")
    ai_score: int = Field(..., description="Overall confidence score in the engine outputs.")
    metadata: ResponseMetadata = Field(..., description="Execution metadata.")


class RecommendationHistoryItem(BaseModel):
    """Stored execution log item for recommendation runs."""

    timestamp: str = Field(..., description="Execution generation timestamp.")
    business_health: BusinessHealth = Field(..., description="Business health indicators.")
    recommendation_count: int = Field(..., description="Total count of recommendations generated.")
    model_version: str = Field(..., description="predictive model version.")
    processing_time: float = Field(..., description="Execution processing time in milliseconds.")
