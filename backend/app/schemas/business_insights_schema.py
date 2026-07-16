"""
Business Insights Schema — app/schemas/business_insights_schema.py
==================================================================

Pydantic schemas for the upgraded GET /business-insights Decision Intelligence API.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class OverallPerformance(BaseModel):
    """Overall performance indicators."""

    total_revenue: float = Field(..., description="Sum of campaign revenue.")
    total_spend: float = Field(..., description="Sum of campaign spends.")
    overall_roas: float = Field(..., description="Overall Return on Ad Spend.")
    overall_profit: float = Field(..., description="Overall profit (Revenue - Spend).")


class BestChannel(BaseModel):
    """Channel with highest ROAS efficiency."""

    best_channel: str = Field(..., description="Name of the best channel.")
    best_roas: float = Field(..., description="Calculated ROAS value for this channel.")


class BestCampaign(BaseModel):
    """Campaign types with highest revenue and highest ROAS."""

    highest_revenue_campaign: str = Field(..., description="Campaign type generating highest average revenue.")
    highest_roas_campaign: str = Field(..., description="Campaign type generating highest average ROAS.")


class BestRegion(BaseModel):
    """Region performance split."""

    highest_revenue_region: str = Field(..., description="Region generating highest average revenue.")
    highest_roas_region: str = Field(..., description="Region generating highest average ROAS.")
    lowest_performing_region: str = Field(..., description="Region generating lowest average revenue.")


class MonthlyTrend(BaseModel):
    """Linear trend analysis for monthly revenues."""

    monthly_slope: float = Field(..., description="Calculated slope value of monthly trend.")
    trend: str = Field(..., description="Trend direction indicator (Increasing, Stable, Declining).")


class WeekendAnalysis(BaseModel):
    """Weekday vs weekend campaign comparison."""

    better_revenue: str = Field(..., description="Indicates whether Weekday or Weekend performs better for average revenue.")
    better_roas: str = Field(..., description="Indicates whether Weekday or Weekend performs better for average ROAS.")
    better_ctr: str = Field(..., description="Indicates whether Weekday or Weekend performs better for average CTR.")
    weekday_revenue: float = Field(..., description="Average revenue on weekdays.")
    weekend_revenue: float = Field(..., description="Average revenue on weekends.")
    weekday_roas: float = Field(..., description="Average ROAS on weekdays.")
    weekend_roas: float = Field(..., description="Average ROAS on weekends.")


class BudgetEfficiency(BaseModel):
    """Marketing spend efficiency assessment."""

    revenue_per_one_spent: float = Field(..., description="Revenue generated per 1 unit of currency spent.")
    efficiency_rating: str = Field(..., description="Efficiency grade (Excellent, Good, Average, Poor).")


class BusinessHealth(BaseModel):
    """Business health score and rating."""

    score: int = Field(..., description="Overall business health score (0-100).")
    rating: str = Field(..., description="Health rating (Excellent, Good, Average, Poor).")


class RiskAnalysis(BaseModel):
    """Risk assessments for budget, channels, and forecast models."""

    budget_risk: str = Field(..., description="Budget Risk level (Low, Medium, High).")
    channel_dependency: str = Field(..., description="Channel Dependency level (Low, Medium, High).")
    forecast_reliability: str = Field(..., description="Forecast Reliability level (Low, Medium, High).")


class GrowthOpportunity(BaseModel):
    """Growth opportunity details."""

    area: str = Field(..., description="Functional area for opportunity expansion.")
    expected_gain: str = Field(..., description="Expected percentage gain (e.g. 11%).")
    priority: str = Field(..., description="Priority tier (High, Medium, Low).")


class DataQuality(BaseModel):
    """Data quality diagnostic metrics."""

    records: int = Field(..., description="Total rows in the analyzed dataset.")
    missing_values: int = Field(..., description="Total count of missing cells in the dataset.")
    duplicates: int = Field(..., description="Total count of duplicate rows in the dataset.")
    quality_score: int = Field(..., description="Overall data quality score (0-100).")


class RecommendationItem(BaseModel):
    """Actionable recommendation with confidence level."""

    recommendation: str = Field(..., description="Actionable recommendations description.")
    confidence: int = Field(..., description="Confidence score as a percentage (0-100).")


class BusinessInsightsResponse(BaseModel):
    """Upgraded enterprise-grade Decision Intelligence response structure."""

    success: bool = Field(..., description="Success indicator.")
    executive_summary: str = Field(..., description="Generated executive summary paragraph.")
    business_health: BusinessHealth = Field(..., description="Overall health score and rating.")
    overall: OverallPerformance = Field(..., description="Overall performance stats.")
    best_channel: BestChannel = Field(..., description="Top marketing channel by ROAS.")
    best_campaign: BestCampaign = Field(..., description="Top campaign type.")
    best_region: BestRegion = Field(..., description="Top region stats.")
    monthly_trend: MonthlyTrend = Field(..., description="Monthly trend stats.")
    weekend_analysis: WeekendAnalysis = Field(..., description="Weekend vs weekday stats.")
    budget_efficiency: BudgetEfficiency = Field(..., description="Budget efficiency rating.")
    risk_analysis: RiskAnalysis = Field(..., description="Risk assessments.")
    growth_opportunities: list[GrowthOpportunity] = Field(..., description="Prioritized list of growth opportunities.")
    data_quality: DataQuality = Field(..., description="Data quality metrics.")
    insights: list[str] = Field(..., description="Plain-English dynamically generated insights.")
    recommendations: list[RecommendationItem] = Field(..., description="List of actionable recommendations with confidence levels.")
