"""
Forecast Service — app/services/forecast_service.py
===================================================

Single responsibility: load the pre-trained LightGBM model, validate the input
marketing campaign features, reconstruct features exactly as done during training
(without leakage), format inputs to align with feature ordering, run prediction,
and return metrics.
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.schemas.forecast_schema import ForecastRequest
from app.services.spend_discovery import load_channel_mapping
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path constants
# ---------------------------------------------------------------------------
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
MODELS_DIR: Path = BACKEND_DIR / "models"
MODEL_FILE: Path = MODELS_DIR / "revenue_model.pkl"
MODEL_INFO_FILE: Path = MODELS_DIR / "model_info.json"
FEATURE_COLUMNS_JSON: Path = MODELS_DIR / "feature_columns.json"

# ---------------------------------------------------------------------------
# Dictionary-based Memory Cache for Multi-User isolated ML assets
# ---------------------------------------------------------------------------
_cached_models: dict[str, Any] = {}
_cached_feature_columns: dict[str, list[str]] = {}
_cached_model_infos: dict[str, dict[str, Any]] = {}
_model_timestamps: dict[str, float] = {}


def _get_model_assets(paths: UserPaths) -> tuple[Any, list[str], dict[str, Any]]:
    """
    Load and return cached model, feature list, and model info metadata.
    Reloads files from disk automatically if the model file is updated.
    """
    MODEL_FILE = paths.revenue_model_file
    MODEL_INFO_FILE = paths.model_info_file
    FEATURE_COLUMNS_JSON = paths.feature_columns_json
    user_id = paths.user_id

    if not MODEL_FILE.exists() or not MODEL_INFO_FILE.exists() or not FEATURE_COLUMNS_JSON.exists():
        error_msg = "Model not trained."
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    current_mtime = MODEL_FILE.stat().st_mtime

    # Load / Reload assets if needed
    if (user_id not in _cached_models or
        user_id not in _cached_feature_columns or
        user_id not in _cached_model_infos or
        _model_timestamps.get(user_id) != current_mtime):
        
        logger.info(f"Loading pre-trained ML model and metadata assets into memory for user {user_id}.")
        _cached_models[user_id] = joblib.load(MODEL_FILE)
        
        with open(FEATURE_COLUMNS_JSON, "r", encoding="utf-8") as f:
            _cached_feature_columns[user_id] = json.load(f)
            
        with open(MODEL_INFO_FILE, "r", encoding="utf-8") as f:
            _cached_model_infos[user_id] = json.load(f)
            
        _model_timestamps[user_id] = current_mtime

    return _cached_models[user_id], _cached_feature_columns[user_id], _cached_model_infos[user_id]


def predict_revenue(input_data: ForecastRequest, paths: UserPaths) -> dict[str, Any]:
    """
    Predict Revenue for a future marketing campaign.
    """
    start_time = time.perf_counter()

    # 1. Load ML assets (Verify model exists)
    model, feature_columns, model_info = _get_model_assets(paths)

    # 2. Input Validation (Verify logical constraints)
    CAMPAIGN_TYPES = ["Awareness", "Brand", "Lead Generation", "Performance", "Remarketing", "Shopping", "Video"]
    REGIONS = ["Central", "East", "North", "South", "West"]

    if input_data.Campaign_Type not in CAMPAIGN_TYPES:
        raise ValueError(f"Invalid Campaign_Type. Must be one of {CAMPAIGN_TYPES}")

    if input_data.Region not in REGIONS:
        raise ValueError(f"Invalid Region. Must be one of {REGIONS}")

    # Load channel mapping
    mapping_payload = load_channel_mapping(paths)
    spend_cols = mapping_payload.get("spend_columns", [])
    mapping = mapping_payload.get("mapping", {})

    input_dict = input_data.model_dump()
    if hasattr(input_data, "model_extra") and input_data.model_extra:
        input_dict.update(input_data.model_extra)

    # Resolve spend for each channel and validate non-negative
    resolved_spends = {}
    for col in spend_cols:
        model_col = mapping.get(col, "Google_Spend")
        val = 0.0
        if col in input_dict:
            val = float(input_dict[col])
        elif model_col in input_dict:
            val = float(input_dict[model_col])
        
        if val < 0:
            raise ValueError("Campaign spends must be non-negative values.")
        resolved_spends[col] = val

    if input_data.Clicks < 0 or input_data.Impressions < 0 or input_data.Conversions < 0:
        raise ValueError("Campaign clicks, impressions, and conversions must be non-negative values.")

    try:
        date_val = pd.to_datetime(input_data.Date)
    except Exception as exc:
        raise ValueError(f"Invalid date format for '{input_data.Date}': {exc}. Must be YYYY-MM-DD.")

    # 3. Recreate Feature Engineering (Replicate training pipeline exactly, round floats to 2 decimals)
    # A. Date Features
    month = date_val.month
    quarter = date_val.quarter
    week = int(date_val.isocalendar()[1])
    day = date_val.day
    day_of_week = date_val.dayofweek
    is_weekend = 1 if day_of_week in [5, 6] else 0

    # B. Spend Features
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

    google_share = google_val / total_spend if total_spend > 0 else 0.0
    meta_share = meta_val / total_spend if total_spend > 0 else 0.0
    microsoft_share = microsoft_val / total_spend if total_spend > 0 else 0.0

    # C. KPIs
    ctr = input_data.Clicks / input_data.Impressions if input_data.Impressions > 0 else 0.0
    cpc = total_spend / input_data.Clicks if input_data.Clicks > 0 else 0.0
    cpm = (total_spend / input_data.Impressions) * 1000.0 if input_data.Impressions > 0 else 0.0
    conversion_rate = input_data.Conversions / input_data.Clicks if input_data.Clicks > 0 else 0.0

    # D. Categorical Encoding (Alphabetical index lookup)
    campaign_mapping = {val: idx for idx, val in enumerate(sorted(CAMPAIGN_TYPES))}
    region_mapping = {val: idx for idx, val in enumerate(sorted(REGIONS))}
    campaign_type_encoded = campaign_mapping[input_data.Campaign_Type]
    region_encoded = region_mapping[input_data.Region]

    # Combine calculated features into a single lookup dictionary, rounded to 2 decimal places
    calculated_features = {
        "Google_Spend": round(float(google_val), 2),
        "Meta_Spend": round(float(meta_val), 2),
        "Microsoft_Spend": round(float(microsoft_val), 2),
        "Clicks": input_data.Clicks,
        "Impressions": input_data.Impressions,
        "Conversions": input_data.Conversions,
        "Month": month,
        "Quarter": quarter,
        "Week": week,
        "Day": day,
        "DayOfWeek": day_of_week,
        "IsWeekend": is_weekend,
        "Total_Spend": round(float(total_spend), 2),
        "Google_Share": round(float(google_share), 2),
        "Meta_Share": round(float(meta_share), 2),
        "Microsoft_Share": round(float(microsoft_share), 2),
        "CTR": round(float(ctr), 2),
        "CPC": round(float(cpc), 2),
        "CPM": round(float(cpm), 2),
        "Conversion_Rate": round(float(conversion_rate), 2),
        "Campaign_Type_Encoded": campaign_type_encoded,
        "Region_Encoded": region_encoded,
    }

    # 4. Construct feature matrix aligning with trained column order
    # Extra columns are ignored, missing features (like leakage columns or Rolling_Spend_7) default to 0.0
    row_data = {}
    for col in feature_columns:
        row_data[col] = calculated_features.get(col, 0.0)

    X_pred = pd.DataFrame([row_data], columns=feature_columns)

    # 5. Predict and record latency
    logger.info("Prediction generated")
    prediction = model.predict(X_pred)[0]
    
    predicted_revenue = round(float(prediction), 2)
    predicted_roas = round(predicted_revenue / total_spend, 2) if total_spend > 0 else 0.0
    
    prediction_time_ms = round((time.perf_counter() - start_time) * 1000.0, 4)

    return {
        "success": True,
        "predicted_revenue": predicted_revenue,
        "total_spend": round(float(total_spend), 2),
        "predicted_roas": predicted_roas,
        "prediction_time_ms": prediction_time_ms,
        "model_version": model_info.get("version", "v3"),
        "available_channels": spend_cols
    }
