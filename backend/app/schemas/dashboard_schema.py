"""
Dashboard Schema — app/schemas/dashboard_schema.py
===================================================

Pydantic schemas for structured representation of dashboard analytics summaries,
performers, and spend splits.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class DashboardSummary(BaseModel):
    """Aggregate campaign KPIs summary."""

    total_revenue: float = Field(..., description="Sum of campaign revenue (rounded to 2 decimals).")
    total_spend: float = Field(..., description="Sum of campaign spends (rounded to 2 decimals).")
    overall_profit: float = Field(..., description="Overall Profit (Total Revenue - Total Spend).")
    profit_margin: float = Field(..., description="Profit Margin percentage.")
    average_daily_revenue: float = Field(..., description="Average Daily Revenue.")
    average_daily_spend: float = Field(..., description="Average Daily Spend.")
    average_roas: float = Field(..., description="Average Return on Ad Spend (rounded to 2 decimals).")
    average_ctr: float = Field(..., description="Average Click Through Rate.")
    average_conversion_rate: float = Field(..., description="Average Conversion Rate.")
    average_cpc: float = Field(..., description="Average Cost Per Click (rounded to 2 decimals).")
    average_cpm: float = Field(..., description="Average Cost Per Thousand Impressions (rounded to 2 decimals).")
    total_clicks: int = Field(..., description="Sum of campaign clicks.")
    total_impressions: int = Field(..., description="Sum of campaign impressions.")
    total_conversions: int = Field(..., description="Sum of campaign conversions.")
    records: int = Field(..., description="Total rows in dataset.")
    columns: int = Field(..., description="Total columns in dataset.")


class TopPerformers(BaseModel):
    """Best performing channels, regions, and campaigns."""

    region: str = Field(..., description="Top performing region by average revenue.")
    campaign: str = Field(..., description="Top campaign type by average revenue.")
    channel: str = Field(..., description="Marketing channel with highest average spend.")
    best_day: str = Field(..., description="Day of week with highest average revenue.")


class MonthlyRevenueItem(BaseModel):
    """Monthly revenue trend item."""

    month: str = Field(..., description="Month name (e.g. Jan, Feb).")
    revenue: float = Field(..., description="Total sum of revenue for this month (rounded to 2 decimals).")


class DashboardResponse(BaseModel):
    """Dashboard analytics GET response structure."""

    success: bool = Field(..., description="Success indicator.")
    summary: DashboardSummary = Field(..., description="Aggregated KPIs summary.")
    top_performers: TopPerformers = Field(..., description="Top performer items.")
    monthly_revenue: list[MonthlyRevenueItem] = Field(..., description="Monthly revenue trend (sorted Jan to Dec).")
    spend_distribution: dict[str, float] = Field(
        ...,
        description="Total spend split per channel (sorted descending by spend value)."
    )
