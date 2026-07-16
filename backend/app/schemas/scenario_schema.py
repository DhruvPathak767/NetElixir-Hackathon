"""
Scenario Schema — app/schemas/scenario_schema.py
=================================================

Pydantic schemas for campaign budget Scenario Comparison (/scenario/compare).
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ScenarioInput(BaseModel):
    """Marketing spend parameters and targeting configuration for a single scenario."""
    model_config = {
        "extra": "allow",
        "json_schema_extra": {
            "example": {
                "google_spend": 50000,
                "meta_spend": 30000,
                "microsoft_spend": 20000,
                "campaign_type": "Performance",
                "region": "East"
            }
        }
    }

    google_spend: float = Field(default=0.0, description="Google Ads spend budget.")
    meta_spend: float = Field(default=0.0, description="Meta spend budget.")
    microsoft_spend: float = Field(default=0.0, description="Microsoft spend budget.")
    campaign_type: str = Field(..., description="Marketing campaign type.")
    region: str = Field(..., description="Target region.")


class ScenarioComparisonRequest(BaseModel):
    """Request body enclosing two compared scenarios."""

    scenario_a: ScenarioInput = Field(..., description="First budget scenario configuration.")
    scenario_b: ScenarioInput = Field(..., description="Second budget scenario configuration.")

    class Config:
        json_schema_extra = {
            "example": {
                "scenario_a": {
                    "google_spend": 50000,
                    "meta_spend": 30000,
                    "microsoft_spend": 20000,
                    "campaign_type": "Performance",
                    "region": "East"
                },
                "scenario_b": {
                    "google_spend": 35000,
                    "meta_spend": 25000,
                    "microsoft_spend": 40000,
                    "campaign_type": "Brand",
                    "region": "North"
                }
            }
        }


class ScenarioOutcome(BaseModel):
    """Calculated prediction indicators for a scenario."""

    revenue: float = Field(..., description="Predicted campaign revenue.")
    profit: float = Field(..., description="Predicted campaign profit (Revenue - Spend).")
    roas: float = Field(..., description="Predicted Return on Ad Spend.")


class BetterBy(BaseModel):
    """Absolute and percentage improvement in key metrics for the winning scenario."""

    revenue_difference: float = Field(..., description="Absolute revenue difference.")
    profit_difference: float = Field(..., description="Absolute profit difference.")
    roas_difference: float = Field(..., description="Absolute ROAS difference.")
    revenue_percent: float = Field(..., description="Revenue percent improvement.")
    profit_percent: float = Field(..., description="Profit percent improvement.")
    roas_percent: float = Field(..., description="ROAS percent improvement.")


class ComparisonResult(BaseModel):
    """Comparison evaluation listing the winning scenario and margins."""

    winner: str = Field(..., description="Name of the winning scenario (Scenario A or Scenario B).")
    better_by: BetterBy = Field(..., description="Aggregated metric absolute and percentage improvements.")


class ScenarioScores(BaseModel):
    """Weighted scores for compared scenarios (0-100)."""

    scenario_a: int = Field(..., description="Score for Scenario A.")
    scenario_b: int = Field(..., description="Score for Scenario B.")


class BestForGoal(BaseModel):
    """Classification of scenarios based on organizational objectives."""

    growth: str = Field(..., description="Best scenario for volume growth.")
    profitability: str = Field(..., description="Best scenario for net profitability.")
    roi: str = Field(..., description="Best scenario for Return on Investment.")
    balanced_strategy: str = Field(..., description="Best balanced recommendation.")


class SpendSplit(BaseModel):
    """Spend allocation splits per scenario."""
    model_config = {
        "extra": "allow"
    }

    google: float = Field(default=0.0, description="Google Ads spend.")
    meta: float = Field(default=0.0, description="Meta spend.")
    microsoft: float = Field(default=0.0, description="Microsoft spend.")
    total: float = Field(..., description="Total aggregate spend.")


class RiskGrid(BaseModel):
    """Risk indicators for decision support."""

    overall: str = Field(..., description="Overall risk level (Low, Medium, High).")
    overspending: str = Field(..., description="Overspending risk level.")
    channel_concentration: str = Field(..., description="Channel concentration risk level.")
    forecast_reliability: str = Field(..., description="Forecast model reliability level.")


class ChartDataset(BaseModel):
    """Visualization data formatted for front-end charts."""

    categories: list[str] = Field(..., description="List of comparison metric names.")
    scenario_a: list[float] = Field(..., description="Metric value sequence for Scenario A.")
    scenario_b: list[float] = Field(..., description="Metric value sequence for Scenario B.")


class ScenarioComparisonResponse(BaseModel):
    """Upgraded enterprise decision support response structure."""

    success: bool = Field(..., description="Success indicator.")
    scenario_a: ScenarioOutcome = Field(..., description="Calculated stats for Scenario A.")
    scenario_b: ScenarioOutcome = Field(..., description="Calculated stats for Scenario B.")
    comparison: ComparisonResult = Field(..., description="Comparative diagnostics.")
    recommendation: str = Field(..., description="Actionable recommended scenario.")
    confidence: int = Field(..., description="Confidence score (percentage).")
    risk_level: str = Field(..., description="Overall risk level.")
    expected_gain: str = Field(..., description="Formatted expected gain.")
    
    # New upgraded fields
    scenario_scores: ScenarioScores = Field(..., description="Weighted scores (0-100) per scenario.")
    winner_reason: str = Field(..., description="Detailed textual rationale for winner selection.")
    best_for: BestForGoal = Field(..., description="Objective-aligned recommendations.")
    scenario_a_spend: SpendSplit = Field(..., description="Spend split configuration for Scenario A.")
    scenario_b_spend: SpendSplit = Field(..., description="Spend split configuration for Scenario B.")
    executive_summary: str = Field(..., description="Enterprise executive summary paragraph.")
    risk_analysis: RiskGrid = Field(..., description="Detailed risk dimensions analysis.")
    roi_improvement: str = Field(..., description="Estimated percentage ROI improvement.")
    recommendation_priority: str = Field(..., description="Priority tier (High, Medium, Low).")
    chart_data: ChartDataset = Field(..., description="JSON charting dataset.")
    processing_time_ms: float = Field(..., description="Total execution duration in milliseconds.")
    available_channels: list[str] = Field(default_factory=list, description="Discovered advertising channels.")
