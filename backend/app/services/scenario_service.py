"""
Scenario Service — app/services/scenario_service.py
===================================================

Single responsibility: compare two different marketing budget scenarios,
predict revenue for each using the Forecast prediction pipeline, compare results,
and calculate confidence scores, risk analyses, growth opportunities, and scores.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

import pandas as pd

from app.schemas.scenario_schema import ScenarioComparisonRequest
from app.schemas.forecast_schema import ForecastRequest
from app.services.forecast_service import predict_revenue
from app.services.spend_discovery import load_channel_mapping
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)


def compare_scenarios(request_data: ScenarioComparisonRequest, paths: UserPaths) -> dict[str, Any]:
    """
    Compare Scenario A and Scenario B, predict their revenues, and evaluate the winner.
    """
    start_time = time.perf_counter()
    logger.info("Executing Scenario Comparison Decision Intelligence analytics.")
    FEATURES_FILE = paths.features_file
    
    # 1. Fetch dynamic averages from features.csv to construct Clicks/Impressions/Conversions
    cpc_avg = 15.90
    cpm_avg = 971.03
    conv_rate_avg = 0.0703
    
    try:
        if FEATURES_FILE.exists():
            df = pd.read_csv(FEATURES_FILE)
            if len(df) > 0:
                cpc_avg = df["CPC"].mean() if "CPC" in df.columns else cpc_avg
                cpm_avg = df["CPM"].mean() if "CPM" in df.columns else cpm_avg
                conv_rate_avg = df["Conversion_Rate"].mean() if "Conversion_Rate" in df.columns else conv_rate_avg
    except Exception as exc:
        logger.warning("Could not read dynamic metrics from features.csv: %s", exc)

    # Load channel mapping
    mapping_payload = load_channel_mapping(paths)
    spend_cols = mapping_payload.get("spend_columns", [])
    mapping = mapping_payload.get("mapping", {})

    # Helper to resolve spends and return original & mapped dicts
    def process_scenario_input(sc_input):
        sc_dict = sc_input.model_dump()
        if hasattr(sc_input, "model_extra") and sc_input.model_extra:
            sc_dict.update(sc_input.model_extra)
            
        resolved_spends = {}
        original_spends = {}
        for col in spend_cols:
            model_col = mapping.get(col, "Google_Spend").lower()
            val = 0.0
            if col in sc_dict:
                val = float(sc_dict[col])
            elif model_col in sc_dict:
                val = float(sc_dict[model_col])
            elif model_col.replace("_spend", "") in sc_dict:
                val = float(sc_dict[model_col.replace("_spend", "")])
            
            resolved_spends[col] = val
            original_spends[col] = val
            
        total_spend = sum(resolved_spends.values())
        
        # Map values to standard model inputs
        google_val = 0.0
        meta_val = 0.0
        microsoft_val = 0.0
        for col, val in resolved_spends.items():
            model_col = mapping.get(col)
            if model_col == "Google_Spend":
                google_val = val
            elif model_col == "Meta_Spend":
                meta_val = val
            elif model_col == "Microsoft_Spend":
                microsoft_val = val

        return total_spend, google_val, meta_val, microsoft_val, original_spends

    # 2. Process Scenario A
    sc_a = request_data.scenario_a
    total_spend_a, google_val_a, meta_val_a, microsoft_val_a, original_spends_a = process_scenario_input(sc_a)
    
    clicks_a = int(round(total_spend_a / cpc_avg)) if total_spend_a > 0 else 0
    impressions_a = int(round((total_spend_a / cpm_avg) * 1000.0)) if total_spend_a > 0 else 0
    conversions_a = int(round(clicks_a * conv_rate_avg)) if clicks_a > 0 else 0

    req_a = ForecastRequest(
        Google_Spend=google_val_a,
        Meta_Spend=meta_val_a,
        Microsoft_Spend=microsoft_val_a,
        Campaign_Type=sc_a.campaign_type,
        Region=sc_a.region,
        Clicks=clicks_a,
        Impressions=impressions_a,
        Conversions=conversions_a,
        Date="2026-07-15"
    )
    for k, v in original_spends_a.items():
        setattr(req_a, k, v)
        
    res_a = predict_revenue(req_a, paths)
    rev_a = res_a["predicted_revenue"]
    roas_a = res_a["predicted_roas"]
    profit_a = round(rev_a - total_spend_a, 2)

    # 3. Process Scenario B
    sc_b = request_data.scenario_b
    total_spend_b, google_val_b, meta_val_b, microsoft_val_b, original_spends_b = process_scenario_input(sc_b)
    
    clicks_b = int(round(total_spend_b / cpc_avg)) if total_spend_b > 0 else 0
    impressions_b = int(round((total_spend_b / cpm_avg) * 1000.0)) if total_spend_b > 0 else 0
    conversions_b = int(round(clicks_b * conv_rate_avg)) if clicks_b > 0 else 0

    req_b = ForecastRequest(
        Google_Spend=google_val_b,
        Meta_Spend=meta_val_b,
        Microsoft_Spend=microsoft_val_b,
        Campaign_Type=sc_b.campaign_type,
        Region=sc_b.region,
        Clicks=clicks_b,
        Impressions=impressions_b,
        Conversions=conversions_b,
        Date="2026-07-15"
    )
    for k, v in original_spends_b.items():
        setattr(req_b, k, v)
        
    res_b = predict_revenue(req_b, paths)
    rev_b = res_b["predicted_revenue"]
    roas_b = res_b["predicted_roas"]
    profit_b = round(rev_b - total_spend_b, 2)

    # 4. Compare Scenarios (Winner has higher profit, or higher revenue as tie-break)
    if profit_b > profit_a:
        winner = "Scenario B"
        loser = "Scenario A"
        winner_rev, loser_rev = rev_b, rev_a
        winner_profit, loser_profit = profit_b, profit_a
        winner_roas, loser_roas = roas_b, roas_a
        winner_spend, loser_spend = total_spend_b, total_spend_a
    elif profit_a > profit_b:
        winner = "Scenario A"
        loser = "Scenario B"
        winner_rev, loser_rev = rev_a, rev_b
        winner_profit, loser_profit = profit_a, profit_b
        winner_roas, loser_roas = roas_a, roas_b
        winner_spend, loser_spend = total_spend_a, total_spend_b
    else:
        # Tie break on revenue
        if rev_b >= rev_a:
            winner = "Scenario B"
            loser = "Scenario A"
            winner_rev, loser_rev = rev_b, rev_a
            winner_profit, loser_profit = profit_b, profit_a
            winner_roas, loser_roas = roas_b, roas_a
            winner_spend, loser_spend = total_spend_b, total_spend_a
        else:
            winner = "Scenario A"
            loser = "Scenario B"
            winner_rev, loser_rev = rev_a, rev_b
            winner_profit, loser_profit = profit_a, profit_b
            winner_roas, loser_roas = roas_a, roas_b
            winner_spend, loser_spend = total_spend_a, total_spend_b

    # 5. Calculate Absolute Differences and Percentages (compared to loser)
    revenue_diff = round(abs(rev_b - rev_a), 2)
    profit_diff = round(abs(profit_b - profit_a), 2)
    roas_diff = round(abs(roas_b - roas_a), 2)

    revenue_diff_pct = ((winner_rev - loser_rev) / loser_rev) * 100.0 if loser_rev > 0 else 0.0
    profit_diff_pct = ((winner_profit - loser_profit) / loser_profit) * 100.0 if loser_profit > 0 else 0.0
    roas_diff_pct = ((winner_roas - loser_roas) / loser_roas) * 100.0 if loser_roas > 0 else 0.0

    # 6. Weighted Scenario Score (0-100)
    # Revenue = 50%, ROAS = 30%, Profit = 20%
    def calc_score(rev: float, roas: float, profit: float) -> int:
        rev_score = min(100.0, (rev / 550000.0) * 100.0)
        roas_score = min(100.0, (roas / 5.0) * 100.0)
        profit_score = min(100.0, (profit / 450000.0) * 100.0)
        return int(round(0.50 * rev_score + 0.30 * roas_score + 0.20 * profit_score))

    score_a = calc_score(rev_a, roas_a, profit_a)
    score_b = calc_score(rev_b, roas_b, profit_b)

    # Ensure winner always has the higher score
    if winner == "Scenario A" and score_a <= score_b:
        score_a = score_b + 1
    elif winner == "Scenario B" and score_b <= score_a:
        score_b = score_a + 1

    # 7. Explain WHY the winner was selected
    if winner_rev > loser_rev and winner_roas >= loser_roas:
        winner_reason = f"{winner} generated higher projected revenue while maintaining a better ROAS."
    elif winner_profit > loser_profit:
        winner_reason = f"{winner} generated higher projected profit (₹{winner_profit:,.2f} vs ₹{loser_profit:,.2f}) due to more efficient budget allocation."
    else:
        winner_reason = f"{winner} delivered stronger overall ROAS."

    # 8. Business Goal Recommendation (Best For Goal classification)
    best_for = {
        "growth": "Scenario A" if rev_a >= rev_b else "Scenario B",
        "profitability": "Scenario A" if profit_a >= profit_b else "Scenario B",
        "roi": "Scenario A" if roas_a >= roas_b else "Scenario B",
        "balanced_strategy": winner
    }

    # 9. Spend Splits
    scenario_a_spend = {
        "google": round(float(google_val_a), 2),
        "meta": round(float(meta_val_a), 2),
        "microsoft": round(float(microsoft_val_a), 2),
        "total": round(float(total_spend_a), 2),
        **{k: round(float(v), 2) for k, v in original_spends_a.items()}
    }
    scenario_b_spend = {
        "google": round(float(google_val_b), 2),
        "meta": round(float(meta_val_b), 2),
        "microsoft": round(float(microsoft_val_b), 2),
        "total": round(float(total_spend_b), 2),
        **{k: round(float(v), 2) for k, v in original_spends_b.items()}
    }

    # 10. Executive Summary Paragraph
    rev_text = "higher" if winner_rev > loser_rev else "comparable"
    profit_text = "higher" if winner_profit > loser_profit else "comparable"
    roas_text = "slightly stronger" if winner_roas > loser_roas else "comparable"
    strategy_text = "business growth" if winner == best_for["growth"] else "profitability"
    
    executive_summary = (
        f"{winner} is expected to outperform {loser} by generating {rev_text} revenue and {profit_text} profit "
        f"while maintaining a {roas_text} ROAS. It is the preferred option for organizations prioritizing {strategy_text}."
    )

    # 11. Dynamic Confidence Score based on Score difference
    score_diff = abs(score_a - score_b)
    if score_diff > 15:
        confidence = 95
    elif score_diff >= 10:
        confidence = 90
    elif score_diff >= 5:
        confidence = 85
    elif score_diff >= 2:
        confidence = 80
    else:
        confidence = 70

    # 12. Improved Risk Analysis
    # A. Overall risk based on winner ROAS
    if winner_roas >= 4.0:
        risk_overall = "Low"
    elif winner_roas >= 3.0:
        risk_overall = "Medium"
    else:
        risk_overall = "High"

    # B. Overspending risk based on winner spend threshold
    if winner_spend > 150000.0:
        risk_overspending = "High"
    elif winner_spend > 80000.0:
        risk_overspending = "Medium"
    else:
        risk_overspending = "Low"

    # C. Channel Concentration risk
    winner_original_spends = original_spends_a if winner == "Scenario A" else original_spends_b
    max_c_spend = max(winner_original_spends.values()) if winner_original_spends else 0.0
    conc_ratio = max_c_spend / winner_spend if winner_spend > 0 else 0.0
    if conc_ratio > 0.60:
        risk_concentration = "High"
    elif conc_ratio > 0.40:
        risk_concentration = "Medium"
    else:
        risk_concentration = "Low"

    # D. Forecast model reliability
    cv_mean_r2 = 0.78
    try:
        from app.services.forecast_service import MODEL_INFO_FILE
        if MODEL_INFO_FILE.exists():
            with open(MODEL_INFO_FILE, "r", encoding="utf-8") as f:
                model_info = json.load(f)
                cv_mean_r2 = model_info.get("cross_validation", {}).get("mean_r2", 0.78)
    except Exception:
        pass

    if cv_mean_r2 >= 0.85:
        risk_reliability = "High"
    elif cv_mean_r2 >= 0.70:
        risk_reliability = "Medium"
    else:
        risk_reliability = "Low"

    # 13. Expected ROI Improvement (relative percent difference of winner ROI vs loser ROI)
    winner_roi = winner_roas - 1.0
    loser_roi = loser_roas - 1.0
    roi_diff_pct = ((winner_roi - loser_roi) / loser_roi) * 100.0 if loser_roi > 0 else 0.0
    roi_improvement = f"{roi_diff_pct:.1f}%"

    # 14. Recommendation Priority
    if confidence >= 90:
        recommendation_priority = "High"
    elif confidence >= 80:
        recommendation_priority = "Medium"
    else:
        recommendation_priority = "Low"

    # 15. Formulate standard comparative recommendations
    if winner_rev > loser_rev and winner_roas > loser_roas:
        recommendation = f"{winner} is recommended because it generates higher projected revenue and better ROAS."
    else:
        recommendation = f"{winner} is recommended because it generates higher projected profit."

    # 16. Chart Visualization Dataset
    chart_data = {
        "categories": ["Revenue", "Profit", "ROAS"],
        "scenario_a": [round(float(rev_a), 2), round(float(profit_a), 2), round(float(roas_a), 2)],
        "scenario_b": [round(float(rev_b), 2), round(float(profit_b), 2), round(float(roas_b), 2)]
    }

    # 17. Final processing time calculation
    processing_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
    expected_gain = f"₹{expected_gain_val:,.2f}" if (expected_gain_val := (winner_rev - loser_rev)) >= 0 else "₹0.00"

    return {
        "success": True,
        "scenario_a": {
            "revenue": round(float(rev_a), 2),
            "profit": round(float(profit_a), 2),
            "roas": round(float(roas_a), 2)
        },
        "scenario_b": {
            "revenue": round(float(rev_b), 2),
            "profit": round(float(profit_b), 2),
            "roas": round(float(roas_b), 2)
        },
        "comparison": {
            "winner": winner,
            "better_by": {
                "revenue_difference": round(float(revenue_diff), 2),
                "profit_difference": round(float(profit_diff), 2),
                "roas_difference": round(float(roas_diff), 2),
                "revenue_percent": round(float(revenue_diff_pct), 2),
                "profit_percent": round(float(profit_diff_pct), 2),
                "roas_percent": round(float(roas_diff_pct), 2)
            }
        },
        "recommendation": recommendation,
        "confidence": confidence,
        "risk_level": risk_overall,
        "expected_gain": expected_gain,
        
        # Upgraded Enterprise diagnostics fields
        "scenario_scores": {
            "scenario_a": score_a,
            "scenario_b": score_b
        },
        "winner_reason": winner_reason,
        "best_for": best_for,
        "scenario_a_spend": scenario_a_spend,
        "scenario_b_spend": scenario_b_spend,
        "executive_summary": executive_summary,
        "risk_analysis": {
            "overall": risk_overall,
            "overspending": risk_overspending,
            "channel_concentration": risk_concentration,
            "forecast_reliability": risk_reliability
        },
        "roi_improvement": roi_improvement,
        "recommendation_priority": recommendation_priority,
        "chart_data": chart_data,
        "processing_time_ms": processing_time_ms,
        "available_channels": spend_cols
    }
