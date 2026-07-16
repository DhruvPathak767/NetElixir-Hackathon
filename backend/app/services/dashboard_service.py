"""
Dashboard Service — app/services/dashboard_service.py
=====================================================

Single responsibility: load features.csv, compute overall marketing KPIs,
determine best performing region, campaign, channel, and day of week, construct
monthly revenue trends, and calculate spend distribution sorted descending.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd

from app.services.spend_discovery import discover_spend_columns
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path constants
# ---------------------------------------------------------------------------
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
FEATURES_FILE: Path = BACKEND_DIR / "processed" / "features.csv"


def get_dashboard_data(paths: UserPaths) -> dict[str, Any]:
    """
    Read processed/features.csv and calculate aggregate insights for dashboard presentation.
    """
    FEATURES_FILE = paths.features_file
    if not FEATURES_FILE.exists():
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_revenue = [{"month": m, "revenue": 0.0} for m in month_names]
        return {
            "success": True,
            "summary": {
                "total_revenue": 0.0,
                "total_spend": 0.0,
                "overall_profit": 0.0,
                "profit_margin": 0.0,
                "average_daily_revenue": 0.0,
                "average_daily_spend": 0.0,
                "average_roas": 0.0,
                "average_ctr": 0.0,
                "average_conversion_rate": 0.0,
                "average_cpc": 0.0,
                "average_cpm": 0.0,
                "total_clicks": 0,
                "total_impressions": 0,
                "total_conversions": 0,
                "records": 0,
                "columns": 0,
                "message": "No dataset uploaded yet."
            },
            "top_performers": {
                "region": "None",
                "campaign": "None",
                "channel": "None",
                "best_day": "None"
            },
            "monthly_revenue": monthly_revenue,
            "spend_distribution": {
                "google": 0.0,
                "meta": 0.0,
                "microsoft": 0.0
            }
        }

    logger.info("Loading features dataset for dashboard calculations.")
    df = pd.read_csv(FEATURES_FILE)

    records = len(df)
    columns = len(df.columns)

    if records == 0:
        raise ValueError("Dataset is empty. Cannot compute dashboard insights on empty data.")

    # 2. Compute sums and averages
    total_revenue = df["Revenue"].sum()
    
    # Discover spend columns
    spend_cols = discover_spend_columns(df, check_numeric=True)
    if not spend_cols:
        spend_cols = ["Google_Spend", "Meta_Spend", "Microsoft_Spend"]
        for col in spend_cols:
            if col not in df.columns:
                df[col] = 0.0

    # Calculate Total_Spend column
    row_spends = df[spend_cols].sum(axis=1)
    total_spend = row_spends.sum()

    # Calculate ROAS safely preventing division by zero
    valid_spend = row_spends > 0
    roas_series = df.loc[valid_spend, "Revenue"] / row_spends[valid_spend]
    average_roas = roas_series.mean() if len(roas_series) > 0 else 0.0

    average_ctr = df["CTR"].mean() if "CTR" in df.columns else 0.0
    average_conversion_rate = df["Conversion_Rate"].mean() if "Conversion_Rate" in df.columns else 0.0
    average_cpc = df["CPC"].mean() if "CPC" in df.columns else 0.0
    average_cpm = df["CPM"].mean() if "CPM" in df.columns else 0.0

    total_clicks = df["Clicks"].sum() if "Clicks" in df.columns else 0
    total_impressions = df["Impressions"].sum() if "Impressions" in df.columns else 0
    total_conversions = df["Conversions"].sum() if "Conversions" in df.columns else 0

    # Upgraded KPIs
    overall_profit = total_revenue - total_spend
    profit_margin = (overall_profit / total_revenue) * 100.0 if total_revenue > 0 else 0.0

    daily_revenue_series = df.groupby("Date")["Revenue"].sum()
    average_daily_revenue = daily_revenue_series.mean() if len(daily_revenue_series) > 0 else 0.0

    daily_spend_series = row_spends.groupby(df["Date"]).sum()
    average_daily_spend = daily_spend_series.mean() if len(daily_spend_series) > 0 else 0.0

    # 3. Determine top performers
    top_region = "Unknown"
    if "Region" in df.columns:
        top_region = str(df.groupby("Region")["Revenue"].mean().idxmax())

    top_campaign = "Unknown"
    if "Campaign_Type" in df.columns:
        top_campaign = str(df.groupby("Campaign_Type")["Revenue"].mean().idxmax())

    # Find highest average spend channel
    spends = {}
    for col in spend_cols:
        display_name = col.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").title()
        spends[display_name] = df[col].mean() if col in df.columns else 0.0
    top_channel = str(max(spends, key=spends.get)) if spends else "None"

    # Find best performing weekday (DayOfWeek)
    best_day = "Unknown"
    if "DayOfWeek" in df.columns:
        weekday_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        best_day_num = df.groupby("DayOfWeek")["Revenue"].mean().idxmax()
        best_day = weekday_names[int(best_day_num)]

    # 4. Construct monthly revenue trend list (sorted Jan to Dec)
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_revenue = []
    for m_num in range(1, 13):
        month_df = df[df["Month"] == m_num]
        month_sum = month_df["Revenue"].sum() if len(month_df) > 0 else 0.0
        monthly_revenue.append({
            "month": month_names[m_num - 1],
            "revenue": round(float(month_sum), 2)
        })

    # 5. Compute spend splits (sorted descending by spend value)
    spend_dist = {}
    for col in spend_cols:
        display_name = col.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").lower()
        spend_dist[display_name] = round(float(df[col].sum()), 2)
        
    for std_key, col_name in [("google", "Google_Spend"), ("meta", "Meta_Spend"), ("microsoft", "Microsoft_Spend")]:
        if col_name in df.columns:
            spend_dist[std_key] = round(float(df[col_name].sum()), 2)

    sorted_spend_dist = dict(sorted(spend_dist.items(), key=lambda item: item[1], reverse=True))

    return {
        "success": True,
        "summary": {
            "total_revenue": round(float(total_revenue), 2),
            "total_spend": round(float(total_spend), 2),
            "overall_profit": round(float(overall_profit), 2),
            "profit_margin": round(float(profit_margin), 2),
            "average_daily_revenue": round(float(average_daily_revenue), 2),
            "average_daily_spend": round(float(average_daily_spend), 2),
            "average_roas": round(float(average_roas), 2),
            "average_ctr": round(float(average_ctr), 4),
            "average_conversion_rate": round(float(average_conversion_rate), 4),
            "average_cpc": round(float(average_cpc), 2),
            "average_cpm": round(float(average_cpm), 2),
            "total_clicks": int(total_clicks),
            "total_impressions": int(total_impressions),
            "total_conversions": int(total_conversions),
            "records": int(records),
            "columns": int(columns)
        },
        "top_performers": {
            "region": top_region,
            "campaign": top_campaign,
            "channel": top_channel,
            "best_day": best_day
        },
        "monthly_revenue": monthly_revenue,
        "spend_distribution": sorted_spend_dist
    }
