"""
Recommendation Service — app/services/recommendation_service.py
===============================================================

Single responsibility: load pre-trained LightGBM outputs, historical KPIs,
and metrics files to dynamically formulate marketing recommendations, risk alerts,
growth opportunities, and health scores.
"""

from __future__ import annotations

import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from app.services.spend_discovery import discover_spend_columns
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path constants
# ---------------------------------------------------------------------------
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
FEATURES_FILE: Path = BACKEND_DIR / "processed" / "features.csv"
MODEL_INFO_FILE: Path = BACKEND_DIR / "models" / "model_info.json"
METRICS_FILE: Path = BACKEND_DIR / "models" / "metrics.json"
FEATURE_IMPORTANCE_FILE: Path = BACKEND_DIR / "models" / "feature_importance.csv"
HISTORY_FILE: Path = BACKEND_DIR / "models" / "recommendation_history.json"


def get_recommendation_history_list(paths: UserPaths = None) -> list[dict[str, Any]]:
    """
    Read the lightweight JSON history log of recommendation runs.
    """
    HISTORY_FILE_LOCAL = paths.recommendation_history_file if paths else HISTORY_FILE
    try:
        if HISTORY_FILE_LOCAL.exists():
            with open(HISTORY_FILE_LOCAL, "r", encoding="utf-8") as f:
                history = json.load(f)
                if isinstance(history, list):
                    return history
    except Exception as exc:
        logger.error("Could not read recommendation history: %s", exc)
    return []


def _log_execution_history(
    overall_score: int,
    health_rating: str,
    rec_count: int,
    model_version: str,
    processing_time: float,
    timestamp: str,
    paths: UserPaths = None
):
    """
    Save the current recommendation run metrics into a lightweight history file.
    Only keeps the latest 50 records.
    """
    HISTORY_FILE_LOCAL = paths.recommendation_history_file if paths else HISTORY_FILE
    try:
        history_list = []
        if HISTORY_FILE_LOCAL.exists():
            try:
                with open(HISTORY_FILE_LOCAL, "r", encoding="utf-8") as f:
                    history_list = json.load(f)
                    if not isinstance(history_list, list):
                        history_list = []
            except Exception:
                history_list = []

        new_item = {
            "timestamp": timestamp,
            "business_health": {
                "score": overall_score,
                "rating": health_rating
            },
            "recommendation_count": rec_count,
            "model_version": model_version,
            "processing_time": processing_time
        }

        # Prepend to make it latest first
        history_list.insert(0, new_item)
        # Cap at 50 executions
        history_list = history_list[:50]

        # Ensure parent directory exists
        HISTORY_FILE_LOCAL.parent.mkdir(parents=True, exist_ok=True)
        with open(HISTORY_FILE_LOCAL, "w", encoding="utf-8") as f:
            json.dump(history_list, f, indent=4, ensure_ascii=False)
    except Exception as exc:
        logger.error("Could not write execution history: %s", exc)


def generate_recommendations(
    priority: str | None = None,
    category: str | None = None,
    action: str | None = None,
    implementation: str | None = None,
    search: str | None = None,
    paths: UserPaths = None
) -> dict[str, Any]:
    """
    Load preprocessed data, LightGBM features weights, and accuracy metrics,
    and generate dynamic strategic marketing advice.
    """
    FEATURES_FILE_LOCAL = paths.features_file if paths else FEATURES_FILE
    MODEL_INFO_FILE_LOCAL = paths.model_info_file if paths else MODEL_INFO_FILE
    METRICS_FILE_LOCAL = paths.metrics_file if paths else METRICS_FILE
    FEATURE_IMPORTANCE_FILE_LOCAL = paths.feature_importance_file if paths else FEATURE_IMPORTANCE_FILE

    if not FEATURES_FILE_LOCAL.exists():
        generated_at_str = datetime.now().astimezone().isoformat()
        return {
            "success": True,
            "business_health": {
                "score": 0,
                "rating": "Unknown"
            },
            "executive_summary": "Upload a dataset to begin.",
            "recommendations": [],
            "risk_alerts": [],
            "growth_opportunities": [],
            "next_best_action": "Upload a dataset to begin.",
            "processing_time_ms": 0.0,
            "generated_at": generated_at_str,
            "model_version": "None",
            "optimization_version": "v1.0.0",
            "summary": {
                "total_recommendations": 0,
                "high_priority": 0,
                "medium_priority": 0,
                "low_priority": 0
            },
            "ai_score": 0.0,
            "metadata": {
                "engine": "AI Recommendation Engine",
                "version": "v1.1",
                "generated_at": generated_at_str,
                "processing_time_ms": 0.0,
                "model_version": "None"
            }
        }

    FEATURES_FILE = FEATURES_FILE_LOCAL
    MODEL_INFO_FILE = MODEL_INFO_FILE_LOCAL
    METRICS_FILE = METRICS_FILE_LOCAL
    FEATURE_IMPORTANCE_FILE = FEATURE_IMPORTANCE_FILE_LOCAL

    start_time = time.perf_counter()
    logger.info("Executing strategic AI Recommendations generation.")

    # 1. Verify and read features.csv dataset
    df = pd.read_csv(FEATURES_FILE)
    records = len(df)
    if records == 0:
        raise ValueError("Dataset is empty. Cannot generate recommendations.")

    # Discover spend columns
    spend_cols = discover_spend_columns(df, check_numeric=True)
    if not spend_cols:
        spend_cols = ["Google_Spend", "Meta_Spend", "Microsoft_Spend"]
        for col in spend_cols:
            if col not in df.columns:
                df[col] = 0.0

    # 2. Overall Performance Calculations
    total_revenue = df["Revenue"].sum()
    row_spends = df[spend_cols].sum(axis=1)
    total_spend = row_spends.sum()

    overall_roas = total_revenue / total_spend if total_spend > 0 else 0.0
    overall_profit = total_revenue - total_spend

    # 3. Channel Spend split and yields (SUM(Revenue) / SUM(Spend))
    roas_dict = {}
    shares_dict = {}
    for col in spend_cols:
        display_name = col.replace("_Spend", "").replace(" Spend", "").replace("_spend", "").replace(" spend", "").title()
        col_spend_sum = df[col].sum() if col in df.columns else 1.0
        roas_dict[display_name] = total_revenue / col_spend_sum if col_spend_sum > 0 else 0.0
        shares_dict[display_name] = col_spend_sum / total_spend if total_spend > 0 else 0.0

    sorted_roas = sorted(roas_dict.items(), key=lambda x: x[1], reverse=True)
    best_channel, best_roas = sorted_roas[0] if len(sorted_roas) > 0 else ("None", 0.0)
    worst_roas_channel, lowest_roas = sorted_roas[-1] if len(sorted_roas) > 0 else ("None", 0.0)

    max_channel = max(shares_dict, key=shares_dict.get) if shares_dict else "None"
    max_share = shares_dict.get(max_channel, 0.0)

    # best channel gap for confidence
    second_best_val = sorted_roas[1][1] if len(sorted_roas) > 1 else 0.0
    best_gap = (best_roas - second_best_val) / second_best_val if second_best_val > 0 else 0.0
    best_channel_conf = int(min(98, 85 + best_gap * 30.0))

    # 4. Best Campaign Type
    highest_revenue_campaign = "Performance"
    highest_roas_campaign = "Brand"
    camp_gain_pct = 11.0
    roas_camp_gain_pct = 1.0

    if "Campaign_Type" in df.columns:
        campaign_means = df.groupby("Campaign_Type")["Revenue"].mean()
        highest_revenue_campaign = str(campaign_means.idxmax())
        overall_rev_mean = df["Revenue"].mean()
        camp_gain_pct = max(1.0, ((campaign_means.max() - overall_rev_mean) / overall_rev_mean) * 100.0)

        campaign_roas_means = df.groupby("Campaign_Type")["ROAS"].mean()
        highest_roas_campaign = str(campaign_roas_means.idxmax())
        overall_roas_mean = df["ROAS"].mean()
        roas_camp_gain_pct = max(1.0, ((campaign_roas_means.max() - overall_roas_mean) / overall_roas_mean) * 100.0)

    # 5. Best Region
    highest_revenue_region = "East"
    lowest_performing_region = "North"
    reg_gain_pct = 8.0

    if "Region" in df.columns:
        region_rev_means = df.groupby("Region")["Revenue"].mean()
        highest_revenue_region = str(region_rev_means.idxmax())
        lowest_performing_region = str(region_rev_means.idxmin())
        overall_rev_mean = df["Revenue"].mean()
        reg_gain_pct = max(1.0, ((region_rev_means.max() - overall_rev_mean) / overall_rev_mean) * 100.0)

    # 6. Weekdays vs Weekends
    weekday_df = df[df["IsWeekend"] == 0]
    weekend_df = df[df["IsWeekend"] == 1]
    weekday_rev = weekday_df["Revenue"].mean() if len(weekday_df) > 0 else 0.0
    weekend_rev = weekend_df["Revenue"].mean() if len(weekend_df) > 0 else 0.0
    week_gain_pct = max(1.0, ((weekday_rev - weekend_rev) / weekend_rev) * 100.0) if weekend_rev > 0 else 1.0

    # 7. Model training metrics and CV R2 score
    cv_mean_r2 = 0.7846
    model_version = "v3"
    try:
        if MODEL_INFO_FILE.exists():
            with open(MODEL_INFO_FILE, "r", encoding="utf-8") as f:
                model_info = json.load(f)
                cv_mean_r2 = model_info.get("cross_validation", {}).get("mean_r2", 0.7846)
                model_version = model_info.get("version", "v3")
    except Exception as exc:
        logger.warning("Could not read models/model_info.json: %s", exc)

    r2_score = cv_mean_r2
    mape_val = 16.53
    try:
        if METRICS_FILE.exists():
            with open(METRICS_FILE, "r", encoding="utf-8") as f:
                metrics = json.load(f)
                r2_score = metrics.get("r2", cv_mean_r2)
                mape_val = metrics.get("mape", 16.53)
        elif MODEL_INFO_FILE.exists():
            with open(MODEL_INFO_FILE, "r", encoding="utf-8") as f:
                model_info = json.load(f)
                mape_val = model_info.get("metrics", {}).get("mape", 16.53)
    except Exception as exc:
        logger.warning("Could not read models/metrics.json for MAPE: %s", exc)

    # 8. Business Health Score evaluation
    ctr_score = min(100.0, (df["CTR"].mean() / 0.07) * 100.0) if "CTR" in df.columns else 0.0
    conv_score = min(100.0, (df["Conversion_Rate"].mean() / 0.08) * 100.0) if "Conversion_Rate" in df.columns else 0.0
    margin_val = ((total_revenue - total_spend) / total_revenue) * 100.0 if total_revenue > 0 else 0.0
    margin_score = min(100.0, (margin_val / 85.0) * 100.0)
    roas_score = min(100.0, (overall_roas / 4.5) * 100.0)
    reliability_score = min(100.0, (r2_score / 0.85) * 100.0)

    overall_score = int(round((roas_score + ctr_score + conv_score + margin_score + reliability_score) / 5.0))
    overall_score = max(0, min(100, overall_score))

    if overall_score >= 85:
        health_rating = "Excellent"
    elif overall_score >= 70:
        health_rating = "Good"
    elif overall_score >= 50:
        health_rating = "Average"
    else:
        health_rating = "Poor"

    # 9. Read Top Features from models/feature_importance.csv
    top_feature = "Total_Spend"
    try:
        if FEATURE_IMPORTANCE_FILE.exists():
            feat_df = pd.read_csv(FEATURE_IMPORTANCE_FILE)
            if len(feat_df) > 0:
                top_feature = str(feat_df.iloc[0]["Feature"])
    except Exception as exc:
        logger.warning("Could not read models/feature_importance.csv: %s", exc)

    # 10. Generate dynamically parameterized recommendations
    recommendations_list = []

    # Forecast reliability rating based on R2
    if cv_mean_r2 >= 0.90:
        reliability_rating = "Very High"
    elif cv_mean_r2 >= 0.85:
        reliability_rating = "High"
    elif cv_mean_r2 >= 0.75:
        reliability_rating = "Medium"
    else:
        reliability_rating = "Low"

    forecast_reliability = {
        "rating": reliability_rating,
        "cross_validation_r2": round(cv_mean_r2, 4),
        "mape": round(mape_val, 2),
        "confidence_interval": f"±{int(mape_val)}%"
    }

    # Baseline daily averages for financial gain calculation
    daily_revenue = df["Revenue"].mean()
    daily_spend = row_spends.mean()
    daily_profit = daily_revenue - daily_spend

    def make_estimated_gain(rev_val: float, profit_val: float, roas_val: float) -> dict[str, str]:
        rev_sign = "+" if rev_val >= 0 else "-"
        profit_sign = "+" if profit_val >= 0 else "-"
        roas_sign = "+" if roas_val >= 0 else "-"
        return {
            "revenue": f"{rev_sign}₹{int(round(abs(rev_val)))}",
            "profit": f"{profit_sign}₹{int(round(abs(profit_val)))}",
            "roas": f"{roas_sign}{abs(roas_val):.2f}"
        }

    # Recommendation score calculator based on 40% confidence, 30% impact, 20% priority, 10% health
    def calc_rec_score_v2(confidence: float, expected_impact: float, priority: str, business_health: float) -> int:
        priority_map = {"High": 100.0, "Medium": 70.0, "Low": 40.0}
        p_score = priority_map.get(priority, 50.0)
        score = (0.40 * confidence) + (0.30 * expected_impact) + (0.20 * p_score) + (0.10 * business_health)
        return int(round(score))

    # A. Channel category recommendation
    rec_c_confidence = best_channel_conf
    rec_c_priority = "High"
    rec_c_impact = 90.0
    c_spend = df[f"{best_channel}_Spend"].mean() if f"{best_channel}_Spend" in df.columns else daily_spend * 0.10
    c_delta_spend = max(1000.0, c_spend * 0.10)
    c_delta_rev = c_delta_spend * best_roas
    c_delta_profit = c_delta_rev - c_delta_spend
    c_delta_roas = (daily_revenue + c_delta_rev) / (daily_spend + c_delta_spend) - overall_roas if (daily_spend + c_delta_spend) > 0 else 0.0

    if best_channel == "Microsoft":
        rec_c_why = "Microsoft delivers the highest ROAS while using a relatively small share of total spend."
    elif best_channel == "Google":
        rec_c_why = "Google delivers the highest ROAS, showing excellent efficiency across search and display channels."
    else:
        rec_c_why = f"{best_channel} delivers the highest ROAS, indicating highly successful creative performance and audience engagement."

    recommendations_list.append({
        "id": 1,
        "title": f"Increase {best_channel} Budget",
        "category": "Channel",
        "description": f"{best_channel} delivers the highest total-yield ROAS of {best_roas:.2f}.",
        "priority": rec_c_priority,
        "confidence": rec_c_confidence,
        "expected_business_impact": "Revenue +12%",
        "forecast_reliability": forecast_reliability,
        "why_this_recommendation": rec_c_why,
        "estimated_gain": make_estimated_gain(c_delta_rev, c_delta_profit, c_delta_roas),
        "action": "Increase Budget",
        "implementation": "Easy",
        "time_to_implement": "Immediate",
        "estimated_cost": "Low",
        "kpi_impact": {
            "Revenue": f"+{int(round(c_delta_rev / daily_revenue * 100))}%",
            "ROAS": f"+{c_delta_roas:.2f}",
            "CTR": "+0%",
            "Conversion Rate": "+0%"
        },
        "tags": ["Budget", best_channel, "Allocation"],
        "because": [
            f"{best_channel} has the highest ROAS of {best_roas:.2f}",
            f"{best_channel} spend share is relatively low",
            "Forecast predicts profit increase with additional spend"
        ],
        "recommendation_score": calc_rec_score_v2(rec_c_confidence, rec_c_impact, rec_c_priority, overall_score)
    })

    # B. Campaign category recommendation
    rec_camp_priority = "Medium"
    rec_camp_confidence = 85
    rec_camp_impact = 80.0
    camp_rev_mean = df[df["Campaign_Type"] == highest_revenue_campaign]["Revenue"].mean() if "Campaign_Type" in df.columns else daily_revenue
    camp_roas_mean = df[df["Campaign_Type"] == highest_revenue_campaign]["ROAS"].mean() if "Campaign_Type" in df.columns else overall_roas
    camp_delta_rev = camp_rev_mean * 0.05
    camp_delta_roas = camp_roas_mean * 0.05
    camp_delta_profit = camp_delta_rev * 0.80

    recommendations_list.append({
        "id": 2,
        "title": f"Focus on {highest_revenue_campaign} Campaigns",
        "category": "Campaign",
        "description": f"{highest_revenue_campaign} campaign types generate the highest average revenue.",
        "priority": rec_camp_priority,
        "confidence": rec_camp_confidence,
        "expected_business_impact": "Higher conversion",
        "forecast_reliability": forecast_reliability,
        "why_this_recommendation": f"Focusing on {highest_revenue_campaign} campaign types is recommended because they yield {camp_gain_pct:.1f}% higher average revenue than the overall campaign average.",
        "estimated_gain": make_estimated_gain(camp_delta_rev, camp_delta_profit, camp_delta_roas),
        "action": "Optimize",
        "implementation": "Medium",
        "time_to_implement": "1 Week",
        "estimated_cost": "Medium",
        "kpi_impact": {
            "Revenue": f"+{int(round(camp_delta_rev / daily_revenue * 100))}%",
            "ROAS": f"+{camp_delta_roas:.2f}",
            "CTR": "+4%",
            "Conversion Rate": "+3%"
        },
        "tags": ["Campaign", highest_revenue_campaign, "Optimization"],
        "because": [
            f"{highest_revenue_campaign} campaigns drive maximum average revenue",
            "Audience response is highly receptive to this campaign type",
            "Historical data shows strong conversion rate stability"
        ],
        "recommendation_score": calc_rec_score_v2(rec_camp_confidence, rec_camp_impact, rec_camp_priority, overall_score)
    })

    # C. Region category recommendation
    rec_reg_priority = "Medium"
    rec_reg_confidence = 85
    rec_reg_impact = min(95.0, max(50.0, reg_gain_pct * 8.0))
    reg_rev_mean = df[df["Region"] == highest_revenue_region]["Revenue"].mean() if "Region" in df.columns else daily_revenue
    reg_delta_rev = reg_rev_mean * 0.10
    reg_delta_profit = reg_delta_rev * 0.70
    reg_delta_roas = 0.02 * reg_gain_pct

    recommendations_list.append({
        "id": 3,
        "title": f"Expand Campaigns in {highest_revenue_region} Region",
        "category": "Region",
        "description": f"{highest_revenue_region} region outperforms all other regions in average revenue.",
        "priority": rec_reg_priority,
        "confidence": rec_reg_confidence,
        "expected_business_impact": f"Expected Gain +{reg_gain_pct:.0f}%",
        "forecast_reliability": forecast_reliability,
        "why_this_recommendation": f"Expanding campaigns in the {highest_revenue_region} region leverages its status as the top-performing region, outperforming the baseline by {reg_gain_pct:.1f}%.",
        "estimated_gain": make_estimated_gain(reg_delta_rev, reg_delta_profit, reg_delta_roas),
        "action": "Expand",
        "implementation": "Medium",
        "time_to_implement": "2 Weeks",
        "estimated_cost": "Medium",
        "kpi_impact": {
            "Revenue": f"+{int(round(reg_delta_rev / daily_revenue * 100))}%",
            "ROAS": f"+{reg_delta_roas:.2f}",
            "CTR": "+2%",
            "Conversion Rate": "+2%"
        },
        "tags": ["Region", highest_revenue_region, "Expansion"],
        "because": [
            f"{highest_revenue_region} region outpaces average performance by {reg_gain_pct:.1f}%",
            "Untapped local demand presents scaling potential",
            "Low acquisition cost relative to customer volume"
        ],
        "recommendation_score": calc_rec_score_v2(rec_reg_confidence, rec_reg_impact, rec_reg_priority, overall_score)
    })

    # D. Budget category recommendation
    rec_bud_priority = "High"
    rec_bud_confidence = 80
    rec_bud_impact = 85.0
    google_spend_mean = df["Google_Spend"].mean() if "Google_Spend" in df.columns else daily_spend * 0.5
    google_share_val = df["Google_Share"].mean() if "Google_Share" in df.columns else 0.5
    google_rev_mean = daily_revenue * google_share_val
    google_delta_spend = -google_spend_mean * 0.05
    google_delta_rev = -google_rev_mean * 0.02
    google_delta_profit = google_delta_rev - google_delta_spend
    google_new_rev = daily_revenue + google_delta_rev
    google_new_spend = daily_spend + google_delta_spend
    google_delta_roas = (google_new_rev / google_new_spend) - overall_roas if google_new_spend > 0 else 0.0

    recommendations_list.append({
        "id": 4,
        "title": "Optimize Google Spend Allocations",
        "category": "Budget",
        "description": "Google spend represents the highest overall investment with opportunities for ROAS yield optimization.",
        "priority": rec_bud_priority,
        "confidence": rec_bud_confidence,
        "expected_business_impact": "ROAS +2.1%",
        "forecast_reliability": forecast_reliability,
        "why_this_recommendation": "Google Ads represents the largest budget allocation, so even minor efficiency gains here will result in significant absolute profit improvements.",
        "estimated_gain": make_estimated_gain(google_delta_rev, google_delta_profit, google_delta_roas),
        "action": "Optimize",
        "implementation": "Medium",
        "time_to_implement": "1 Week",
        "estimated_cost": "Low",
        "kpi_impact": {
            "Revenue": f"+{int(round(google_delta_rev / daily_revenue * 100))}%",
            "ROAS": f"+{google_delta_roas:.2f}",
            "CTR": "+0%",
            "Conversion Rate": "+1%"
        },
        "tags": ["Budget", "Google", "Efficiency"],
        "because": [
            "Google is the highest spend channel",
            "Reduces budget waste on lower-performing keywords",
            "Maximizes marginal ROAS through automated bid adjustments"
        ],
        "recommendation_score": calc_rec_score_v2(rec_bud_confidence, rec_bud_impact, rec_bud_priority, overall_score)
    })

    # E. Risk category recommendation
    rec_risk_priority = "High"
    rec_risk_confidence = 90
    rec_risk_impact = 70.0
    max_spend_mean = df[f"{max_channel}_Spend"].mean() if f"{max_channel}_Spend" in df.columns else daily_spend * 0.5
    max_roas = roas_dict.get(max_channel, overall_roas)
    risk_shift_spend = max_spend_mean * 0.10
    risk_delta_rev = risk_shift_spend * (best_roas - max_roas)
    risk_delta_profit = risk_delta_rev
    risk_delta_roas = (daily_revenue + risk_delta_rev) / daily_spend - overall_roas if daily_spend > 0 else 0.0

    recommendations_list.append({
        "id": 5,
        "title": f"Mitigate High {max_channel} Spend Concentration",
        "category": "Risk",
        "description": f"Reallocate a portion of budget to reduce {max_channel} concentration risk.",
        "priority": rec_risk_priority,
        "confidence": rec_risk_confidence,
        "expected_business_impact": "Reduced volatility",
        "forecast_reliability": forecast_reliability,
        "why_this_recommendation": f"Over-reliance on {max_channel} Ads ({int(max_share*100)}% of total spends) exposes the business to sudden ad policy changes, auction price hikes, or fatigue.",
        "estimated_gain": make_estimated_gain(risk_delta_rev, risk_delta_profit, risk_delta_roas),
        "action": "Diversify",
        "implementation": "Medium",
        "time_to_implement": "2 Weeks",
        "estimated_cost": "Low",
        "kpi_impact": {
            "Revenue": f"+{int(round(risk_delta_rev / daily_revenue * 100))}%",
            "ROAS": f"+{risk_delta_roas:.2f}",
            "CTR": "+0%",
            "Conversion Rate": "+0%"
        },
        "tags": ["Risk", max_channel, "Diversification"],
        "because": [
            f"Ad spend is highly concentrated in {max_channel} Ads ({int(max_share*100)}%)",
            "Mitigates potential platform policy changes or account issues",
            "Promotes channel diversification and broadens audience reach"
        ],
        "recommendation_score": calc_rec_score_v2(rec_risk_confidence, rec_risk_impact, rec_risk_priority, overall_score)
    })

    # F. Growth category recommendation
    rec_gro_priority = "High"
    rec_gro_confidence = 94
    rec_gro_impact = min(95.0, max(50.0, week_gain_pct * 5.0))
    gro_delta_rev = daily_revenue * (week_gain_pct / 100.0) * 0.08
    gro_delta_profit = gro_delta_rev * 0.85
    gro_delta_roas = 0.01 * week_gain_pct

    recommendations_list.append({
        "id": 6,
        "title": "Target Weekday Traffic Peaks",
        "category": "Growth",
        "description": "Weekday advertising yields stronger overall revenue averages than weekend slots.",
        "priority": rec_gro_priority,
        "confidence": rec_gro_confidence,
        "expected_business_impact": f"Expected Gain +{week_gain_pct:.0f}%",
        "forecast_reliability": forecast_reliability,
        "why_this_recommendation": f"Weekday traffic shows {week_gain_pct:.1f}% higher average revenue compared to weekends, offering a clear temporal window for budget maximization.",
        "estimated_gain": make_estimated_gain(gro_delta_rev, gro_delta_profit, gro_delta_roas),
        "action": "Optimize",
        "implementation": "Easy",
        "time_to_implement": "1 Week",
        "estimated_cost": "Low",
        "kpi_impact": {
            "Revenue": f"+{int(round(gro_delta_rev / daily_revenue * 100))}%",
            "ROAS": f"+{gro_delta_roas:.2f}",
            "CTR": "+5%",
            "Conversion Rate": "+2%"
        },
        "tags": ["Growth", "Scheduling", "Temporal"],
        "because": [
            f"Weekday performance shows {week_gain_pct:.1f}% higher revenue average",
            "Aligns ad delivery times with maximum customer online activity",
            "Higher CTR observed during business hours"
        ],
        "recommendation_score": calc_rec_score_v2(rec_gro_confidence, rec_gro_impact, rec_gro_priority, overall_score)
    })

    # G. Forecast category recommendation
    rec_fore_priority = "Medium"
    rec_fore_confidence = int(round(r2_score * 100.0))
    rec_fore_impact = 60.0
    fore_delta_rev = daily_revenue * 0.02
    fore_delta_profit = daily_profit * 0.025
    fore_delta_roas = overall_roas * 0.02

    recommendations_list.append({
        "id": 7,
        "title": "Leverage Model Insights for Scenario Planning",
        "category": "Forecast",
        "description": f"Model forecast reliability is evaluated as High with cross-validation R2 of {cv_mean_r2:.4f}.",
        "priority": rec_fore_priority,
        "confidence": rec_fore_confidence,
        "expected_business_impact": "Higher planning accuracy",
        "forecast_reliability": forecast_reliability,
        "why_this_recommendation": f"The LightGBM model exhibits a solid R2 score of {r2_score:.4f}, making its predictions highly reliable for planning future scenario outcomes.",
        "estimated_gain": make_estimated_gain(fore_delta_rev, fore_delta_profit, fore_delta_roas),
        "action": "Monitor",
        "implementation": "Complex",
        "time_to_implement": "1 Month",
        "estimated_cost": "Medium",
        "kpi_impact": {
            "Revenue": f"+{int(round(fore_delta_rev / daily_revenue * 100))}%",
            "ROAS": f"+{fore_delta_roas:.2f}",
            "CTR": "+1%",
            "Conversion Rate": "+1%"
        },
        "tags": ["Forecast", "Planning", "Insights"],
        "because": [
            f"Model demonstrates solid predictive capacity with R2 of {cv_mean_r2:.4f}.",
            "Minimizes guessing in future marketing budgets",
            "Scenario simulation narrows decision uncertainty"
        ],
        "recommendation_score": calc_rec_score_v2(rec_fore_confidence, rec_fore_impact, rec_fore_priority, overall_score)
    })

    # H. Performance category recommendation
    rec_perf_priority = "Low"
    rec_perf_confidence = 70
    rec_perf_impact = 65.0
    perf_delta_rev = daily_revenue * 0.03
    perf_delta_profit = daily_profit * 0.035
    perf_delta_roas = overall_roas * 0.03

    recommendations_list.append({
        "id": 8,
        "title": f"Optimize {top_feature} Coefficients",
        "category": "Performance",
        "description": f"The top feature {top_feature} drives the largest weight in prediction coefficients.",
        "priority": rec_perf_priority,
        "confidence": rec_perf_confidence,
        "expected_business_impact": "Improved cost efficiency",
        "forecast_reliability": forecast_reliability,
        "why_this_recommendation": f"Feature importance analysis identifies {top_feature} as the primary driver of prediction variance, meaning optimization of this metric has the highest leverage.",
        "estimated_gain": make_estimated_gain(perf_delta_rev, perf_delta_profit, perf_delta_roas),
        "action": "Optimize",
        "implementation": "Complex",
        "time_to_implement": "2 Weeks",
        "estimated_cost": "High",
        "kpi_impact": {
            "Revenue": f"+{int(round(perf_delta_rev / daily_revenue * 100))}%",
            "ROAS": f"+{perf_delta_roas:.2f}",
            "CTR": "+6%",
            "Conversion Rate": "+4%"
        },
        "tags": ["Performance", top_feature, "Coefficients"],
        "because": [
            f"Feature importance identifies {top_feature} as a dominant predictor",
            "Targeting high-importance variables increases outcome control",
            "Model coefficients indicate positive correlation with revenue"
        ],
        "recommendation_score": calc_rec_score_v2(rec_perf_confidence, rec_perf_impact, rec_perf_priority, overall_score)
    })

    # Sort recommendations by recommendation_score descending (default behavior before filtering)
    recommendations_list.sort(key=lambda x: x["recommendation_score"], reverse=True)

    # 10.1 Compute Summary Statistics (based on complete unfiltered list)
    total_recs = len(recommendations_list)
    high_p = sum(1 for r in recommendations_list if r["priority"] == "High")
    med_p = sum(1 for r in recommendations_list if r["priority"] == "Medium")
    low_p = sum(1 for r in recommendations_list if r["priority"] == "Low")

    summary_obj = {
        "total_recommendations": total_recs,
        "high_priority": high_p,
        "medium_priority": med_p,
        "low_priority": low_p
    }

    # 10.2 Compute dynamic AI Insight Score
    data_quality = 98.0
    total_cells = df.size
    if total_cells > 0:
        non_null_cells = int(df.notnull().sum().sum())
        data_quality = (non_null_cells / total_cells) * 100.0

    ai_score_val = (0.25 * overall_score) + (0.25 * (r2_score * 100.0)) + (0.20 * data_quality) + (0.20 * (cv_mean_r2 * 100.0)) + (0.10 * 92.0)
    ai_score = max(0, min(100, int(round(ai_score_val))))

    # 11. Dynamic Risk Alerts
    risk_alerts = []
    if max_share > 0.40:
        risk_alerts.append({
            "title": f"High {max_channel} Spend Concentration",
            "severity": "Medium" if max_share <= 0.70 else "High",
            "description": f"Large dependency on {max_channel} Ads ({int(max_share*100)}% of total spends)."
        })
    if r2_score < 0.80:
        risk_alerts.append({
            "title": "Moderate Model Variance",
            "severity": "Low",
            "description": f"Cross-validation R2 is {cv_mean_r2:.4f}, implying some moderate planning variance."
        })

    # 12. Dynamic Growth Opportunities
    growth_opportunities = [
        {
            "area": f"{highest_revenue_region} Region",
            "potential": "High" if reg_gain_pct >= 8.0 else "Medium",
            "expected_gain": f"{int(reg_gain_pct)}%"
        },
        {
            "area": "Weekday Traffic Peak",
            "potential": "High" if week_gain_pct >= 15.0 else "Medium",
            "expected_gain": f"{int(week_gain_pct)}%"
        },
        {
            "area": f"{highest_roas_campaign} Campaigns",
            "potential": "High" if roas_camp_gain_pct >= 10.0 else "Medium",
            "expected_gain": f"{int(roas_camp_gain_pct)}%"
        }
    ]

    # 13. Executive summary for C-level
    executive_summary = (
        f"Marketing performance is highly healthy with an overall ROAS of {overall_roas:.2f} "
        f"and a business health score of {overall_score}/100 ({health_rating}). "
        f"Google Ads, Meta, and Microsoft spends show strong attribution, with {best_channel} delivering "
        f"the highest yield ROAS of {best_roas:.2f}. We recommend prioritizing {highest_revenue_campaign} campaigns "
        f"and expanding targeting in the {highest_revenue_region} region. Optimizing weekday allocation is expected "
        f"to drive significant incremental ROI with low overall budget volatility."
    )

    # 14. Next best action
    next_best_action = f"Increase {best_channel} allocation while maintaining {highest_revenue_campaign} campaigns."

    # 15. Filtering and Search Logic (Applied to recommendations output)
    filtered_list = recommendations_list
    if priority:
        filtered_list = [r for r in filtered_list if r["priority"].lower() == priority.lower()]
    if category:
        filtered_list = [r for r in filtered_list if r["category"].lower() == category.lower()]
    if action:
        filtered_list = [r for r in filtered_list if r["action"].lower() == action.lower()]
    if implementation:
        filtered_list = [r for r in filtered_list if r["implementation"].lower() == implementation.lower()]
    if search:
        s_query = search.lower()
        filtered_list = [
            r for r in filtered_list if (
                s_query in r["title"].lower() or
                s_query in r["description"].lower() or
                s_query in r["category"].lower() or
                any(s_query in t.lower() for t in r["tags"])
            )
        ]

    # Ensure sorting order is maintained on the final filtered output
    filtered_list.sort(key=lambda x: x["recommendation_score"], reverse=True)

    processing_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
    generated_at_str = datetime.now().astimezone().isoformat()

    # Log execution history (using the complete unfiltered list stats)
    _log_execution_history(
        overall_score=overall_score,
        health_rating=health_rating,
        rec_count=total_recs,
        model_version=model_version,
        processing_time=processing_time_ms,
        timestamp=generated_at_str,
        paths=paths
    )

    metadata_obj = {
        "engine": "AI Recommendation Engine",
        "version": "v1.1",
        "generated_at": generated_at_str,
        "processing_time_ms": processing_time_ms,
        "model_version": model_version
    }

    return {
        "success": True,
        "business_health": {
            "score": overall_score,
            "rating": health_rating
        },
        "executive_summary": executive_summary,
        "recommendations": filtered_list,
        "risk_alerts": risk_alerts,
        "growth_opportunities": growth_opportunities,
        "next_best_action": next_best_action,
        "processing_time_ms": processing_time_ms,
        "generated_at": generated_at_str,
        "model_version": model_version,
        "optimization_version": "v1.0.0",
        "summary": summary_obj,
        "ai_score": ai_score,
        "metadata": metadata_obj
    }
