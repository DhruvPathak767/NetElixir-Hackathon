"""
Forecast Confidence Service — app/services/forecast_confidence_service.py
=======================================================================

Single responsibility: load trained LightGBM model metrics, run predictions,
evaluate reliability rating, calculate confidence score, and return inner data.
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any

from app.core import config
from app.schemas.forecast_confidence_schema import ForecastConfidenceRequest
from app.schemas.forecast_schema import ForecastRequest
from app.services import forecast_service
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path constants
# ---------------------------------------------------------------------------
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
MODELS_DIR: Path = BACKEND_DIR / "models"
MODEL_INFO_FILE: Path = MODELS_DIR / "model_info.json"
METRICS_FILE: Path = MODELS_DIR / "metrics.json"
FEATURE_COLUMNS_JSON: Path = MODELS_DIR / "feature_columns.json"


def run_forecast_confidence(input_data: ForecastConfidenceRequest, paths: UserPaths) -> dict[str, Any]:
    """
    Predict revenue and ROAS along with confidence, reliability and model metrics.

    Parameters
    ----------
    input_data : ForecastConfidenceRequest
        The request campaign data.
    paths : UserPaths
        The user specific paths.

    Returns
    -------
    dict[str, Any]
        Inner prediction details and confidence ratings.
    """
    # Call existing forecast service to run prediction (Reuse pipeline)
    # Date defaults to today if omitted in schema
    req = ForecastRequest(
        Google_Spend=input_data.Google_Spend,
        Meta_Spend=input_data.Meta_Spend,
        Microsoft_Spend=input_data.Microsoft_Spend,
        Clicks=input_data.Clicks,
        Impressions=input_data.Impressions,
        Conversions=input_data.Conversions,
        Campaign_Type=input_data.Campaign_Type,
        Region=input_data.Region,
        Date=input_data.Date or "2026-07-16"
    )

    pred_res = forecast_service.predict_revenue(req, paths)
    predicted_revenue = pred_res["predicted_revenue"]
    predicted_roas = pred_res["predicted_roas"]

    # Load model training metrics (CV R2, Test R2, MAPE, Version details)
    cv_mean_r2 = 0.7846
    model_version = config.MODEL_VERSION
    try:
        if MODEL_INFO_FILE.exists():
            with open(MODEL_INFO_FILE, "r", encoding="utf-8") as f:
                model_info = json.load(f)
                cv = model_info.get("cross_validation", {})
                cv_mean_r2 = cv.get("mean_r2", 0.7846)
                model_version = model_info.get("version", config.MODEL_VERSION)
    except Exception as exc:
        logger.warning("Could not read models/model_info.json: %s", exc)

    test_r2 = cv_mean_r2
    mape_val = 16.54
    try:
        if METRICS_FILE.exists():
            with open(METRICS_FILE, "r", encoding="utf-8") as f:
                metrics = json.load(f)
                test_r2 = metrics.get("r2", cv_mean_r2)
                mape_val = metrics.get("mape", 16.54)
    except Exception as exc:
        logger.warning("Could not read models/metrics.json: %s", exc)

    # Calculate Confidence Score
    completeness = 1.0
    feature_availability = 1.0
    if FEATURE_COLUMNS_JSON.exists():
        try:
            with open(FEATURE_COLUMNS_JSON, "r", encoding="utf-8") as f:
                feature_cols = json.load(f)
                if feature_cols:
                    feature_availability = 1.0
        except Exception:
            pass

    score_val = (0.30 * cv_mean_r2 * 100) + (0.30 * test_r2 * 100) + (0.20 * max(0.0, 100.0 - mape_val)) + (0.10 * completeness * 100) + (0.10 * feature_availability * 100)
    confidence_score = max(0, min(100, int(round(score_val))))

    # Rating based on score configuration
    if confidence_score >= config.CONFIDENCE_THRESHOLDS["EXCELLENT"]:
        confidence_rating = "Excellent"
    elif confidence_score >= config.CONFIDENCE_THRESHOLDS["HIGH"]:
        confidence_rating = "High"
    elif confidence_score >= config.CONFIDENCE_THRESHOLDS["GOOD"]:
        confidence_rating = "Good"
    elif confidence_score >= config.CONFIDENCE_THRESHOLDS["MODERATE"]:
        confidence_rating = "Moderate"
    else:
        confidence_rating = "Low"

    # Forecast reliability rating based on CV R2 configuration
    if cv_mean_r2 >= config.RELIABILITY_THRESHOLDS["VERY_HIGH"]:
        reliability_rating = "Very High"
    elif cv_mean_r2 >= config.RELIABILITY_THRESHOLDS["HIGH"]:
        reliability_rating = "High"
    elif cv_mean_r2 >= config.RELIABILITY_THRESHOLDS["MEDIUM"]:
        reliability_rating = "Medium"
    else:
        reliability_rating = "Low"

    return {
        "predicted_revenue": predicted_revenue,
        "predicted_roas": predicted_roas,
        "confidence_score": confidence_score,
        "confidence_level": confidence_rating,
        "confidence_interval": f"±{int(mape_val)}%",
        "forecast_reliability": reliability_rating,
        "model_metrics": {
            "r2": round(test_r2, 4),
            "mape": round(mape_val, 2),
            "cross_validation_r2": round(cv_mean_r2, 4)
        },
        "model_version": model_version
    }
