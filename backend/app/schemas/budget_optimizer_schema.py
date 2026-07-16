"""
Budget Optimizer Schema — app/schemas/budget_optimizer_schema.py
===============================================================

Pydantic schemas for the upgraded enterprise-grade GET/POST /optimize-budget endpoint.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class BudgetOptimizationRequest(BaseModel):
    """Request body specifying the total budget to optimize."""

    total_budget: float = Field(..., description="The total advertising budget to allocate.", gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "total_budget": 100000
            }
        }


class RecommendedBudgetSplit(BaseModel):
    """Budget split per channel."""
    model_config = {
        "extra": "allow"
    }

    google: float = Field(default=0.0, description="Google Ads optimized spend.")
    meta: float = Field(default=0.0, description="Meta optimized spend.")
    microsoft: float = Field(default=0.0, description="Microsoft optimized spend.")


class BudgetEfficiency(BaseModel):
    """ROAS comparison between baseline and optimized budgets."""

    current_roas: float = Field(..., description="The baseline ROAS from an even budget allocation.")
    optimized_roas: float = Field(..., description="The ROAS of the optimized budget allocation.")
    improvement_percent: float = Field(..., description="Percentage improvement in ROAS yield.")


class ChannelAnalysisItem(BaseModel):
    """Specific channel performance diagnostic."""

    allocation_percent: float = Field(..., description="Budget share allocated to the channel.")
    expected_roi: str = Field(..., description="Expected ROI rating (High, Medium, Low).")
    reason: str = Field(..., description="Rationale for ad-spend allocation.")


class ChannelAnalysis(BaseModel):
    """Channel evaluations mapping."""
    model_config = {
        "extra": "allow"
    }

    google: ChannelAnalysisItem | None = Field(default=None, description="Google analytics diagnostic.")
    meta: ChannelAnalysisItem | None = Field(default=None, description="Meta analytics diagnostic.")
    microsoft: ChannelAnalysisItem | None = Field(default=None, description="Microsoft analytics diagnostic.")


class RiskAnalysis(BaseModel):
    """Spend concentration risk assessment."""

    risk: str = Field(..., description="Risk tier level (Low, Medium, High).")
    reason: str = Field(..., description="Explanation of ad concentration or balance.")


class RecommendationItem(BaseModel):
    """Actionable budget and targeting recommendation."""

    text: str = Field(..., description="Description of the action.")
    priority: str = Field(..., description="Priority level (High, Medium, Low).")
    confidence: int = Field(..., description="Confidence score (percentage).")


class TopRecommendationItem(BaseModel):
    """High-performing budget allocation choice."""
    model_config = {
        "extra": "allow"
    }

    rank: int = Field(..., description="Choice rank from 1 to 5.")
    google: float = Field(default=0.0, description="Google spend.")
    meta: float = Field(default=0.0, description="Meta spend.")
    microsoft: float = Field(default=0.0, description="Microsoft spend.")
    predicted_revenue: float = Field(..., description="Projected campaign revenue.")
    predicted_profit: float = Field(..., description="Projected campaign profit.")
    roas: float = Field(..., description="Projected campaign ROAS.")


class ChartDataset(BaseModel):
    """Visualization dataset ready for charting."""

    labels: list[str] = Field(..., description="List of channel names.")
    recommended_budget: list[float] = Field(..., description="Recommended ad-spend per channel.")
    predicted_revenue: list[float] = Field(..., description="Attributed revenue per channel.")


# New upgraded sub-schemas
class ForecastReliability(BaseModel):
    """Model forecast metrics and cross validation rating."""

    rating: str = Field(..., description="Cross validation reliability rating (Very High, High, Medium, Low).")
    cross_validation_r2: float = Field(..., description="Cross validation mean R2 score.")


class BusinessImpact(BaseModel):
    """Financial impact metrics compared to baseline."""

    additional_profit: float = Field(..., description="Additional profit generated.")
    additional_revenue: float = Field(..., description="Additional revenue generated.")
    expected_growth: str = Field(..., description="Expected percentage ROAS growth.")
    payback: str = Field(..., description="Investment payback speed.")


class ExecutiveMetrics(BaseModel):
    """Executive ROI overview indicators."""

    investment: float = Field(..., description="Total investment budget.")
    predicted_profit: float = Field(..., description="Projected profit.")
    net_gain: float = Field(..., description="Projected net gain (Profit - Spend).")
    roi_percent: int = Field(..., description="ROI percentage.")


class BudgetOptimizationResponse(BaseModel):
    """Upgraded enterprise budget optimization response."""
    model_config = {
        "extra": "allow"
    }

    success: bool = Field(..., description="Success indicator.")
    recommended_budget: RecommendedBudgetSplit = Field(..., description="Optimal budget splits.")
    predicted_revenue: float = Field(..., description="Predicted revenue.")
    predicted_profit: float = Field(..., description="Predicted profit.")
    predicted_roas: float = Field(..., description="Predicted ROAS.")
    confidence: int = Field(..., description="Confidence score (percentage).")
    opportunity_score: int = Field(..., description="Aggregated yield opportunity score (0-100).")
    budget_efficiency: BudgetEfficiency = Field(..., description="ROAS efficiency gains comparison.")
    optimization_reason: str = Field(..., description="Rationale for winner selection.")
    channel_analysis: ChannelAnalysis = Field(..., description="Channel specific analytics.")
    risk_analysis: RiskAnalysis = Field(..., description="Spend concentration risk analysis.")
    executive_summary: str = Field(..., description="Enterprise executive summary paragraph.")
    insights: list[str] = Field(..., description="Plain-English dynamically generated insights.")
    recommendations: list[RecommendationItem] = Field(..., description="List of prioritized recommendations.")
    top_recommendations: list[TopRecommendationItem] = Field(..., description="Top 5 allocations sorted by profit.")
    chart_data: ChartDataset = Field(..., description="JSON charting dataset.")
    processing_time_ms: float = Field(..., description="The time taken to run the optimization process.")
    
    # New upgraded fields
    optimization_id: str = Field(..., description="Unique optimization transaction ID.")
    model_version: str = Field(..., description="ML model version code.")
    optimization_strategy: str = Field(..., description="The mathematical goal optimization strategy.")
    forecast_reliability: ForecastReliability = Field(..., description="Model metrics forecast reliability.")
    allocation_diversity: int = Field(..., description="Budget split diversification score (0-100).")
    business_impact: BusinessImpact = Field(..., description="Comparative business growth impact metrics.")
    executive_metrics: ExecutiveMetrics = Field(..., description="Executive marketing ROI indicators.")
    available_channels: list[str] = Field(default_factory=list, description="Discovered advertising channels.")
