"""
Simulation Service — app/services/simulation_service.py
=========================================================

Single responsibility: load pre-trained model and schemas, perform budget
scenario simulations, validate data inputs, recreate the exact feature set,
and compute profit and ROAS metrics.
"""

from __future__ import annotations

import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from app.schemas.simulation_schema import SimulationRequest
from app.services.spend_discovery import load_channel_mapping
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
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
    Fetch and return model, features list, and model info metadata from cache or disk.
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


def simulate_budget(input_data: SimulationRequest, paths: UserPaths) -> dict[str, Any]:
    """
    Simulate Revenue for a future campaign under different budget assumptions.
    """
    start_time = time.perf_counter()

    # 1. Load ML assets
    model, feature_columns, model_info = _get_model_assets(paths)
    
    # 2. Load Mapping
    mapping_payload = load_channel_mapping(paths)
    spend_cols = mapping_payload.get("spend_columns", [])
    mapping = mapping_payload.get("mapping", {})

    input_dict = input_data.model_dump()
    if hasattr(input_data, "model_extra") and input_data.model_extra:
        input_dict.update(input_data.model_extra)

    # Resolve spend for each channel and validate non-negative
    resolved_spends = {}
    for col in spend_cols:
        model_col = mapping.get(col, "Google_Spend").lower()
        val = 0.0
        if col in input_dict:
            val = float(input_dict[col])
        elif model_col in input_dict:
            val = float(input_dict[model_col])
        elif model_col.replace("_spend", "") in input_dict:
            val = float(input_dict[model_col.replace("_spend", "")])
            
        if val < 0:
            raise ValueError("Spends must be non-negative values.")
        resolved_spends[col] = val

    if input_data.clicks < 0 or input_data.impressions < 0 or input_data.conversions < 0:
        raise ValueError("Clicks, impressions, and conversions must be non-negative values.")

    if not (1 <= input_data.month <= 12):
        raise ValueError("Month must be between 1 and 12.")

    if not (1 <= input_data.day <= 31):
        raise ValueError("Day must be between 1 and 31.")

    if not (0 <= input_data.day_of_week <= 6):
        raise ValueError("day_of_week must be between 0 (Monday) and 6 (Sunday).")

    if input_data.is_weekend not in [0, 1]:
        raise ValueError("is_weekend must be 0 or 1.")

    # 3. Categorical Check
    CAMPAIGN_TYPES = ["Awareness", "Brand", "Lead Generation", "Performance", "Remarketing", "Shopping", "Video"]
    REGIONS = ["Central", "East", "North", "South", "West"]

    if input_data.campaign_type not in CAMPAIGN_TYPES:
        raise ValueError(f"Invalid campaign_type. Must be one of {CAMPAIGN_TYPES}")

    if input_data.region not in REGIONS:
        raise ValueError(f"Invalid region. Must be one of {REGIONS}")

    # 4. Date Validation & estimation of Quarter / Week
    try:
        dt = datetime(year=2026, month=input_data.month, day=input_data.day)
        week = int(dt.isocalendar()[1])
        quarter = (input_data.month - 1) // 3 + 1
    except Exception as exc:
        raise ValueError(f"Invalid month/day combination (e.g. Feb 30th): {exc}")

    # 5. Feature Engineering (Construct training feature set exactly, round floats to 2 decimals)
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

    ctr = input_data.clicks / input_data.impressions if input_data.impressions > 0 else 0.0
    cpc = total_spend / input_data.clicks if input_data.clicks > 0 else 0.0
    cpm = (total_spend / input_data.impressions) * 1000.0 if input_data.impressions > 0 else 0.0
    conversion_rate = input_data.conversions / input_data.clicks if input_data.clicks > 0 else 0.0

    campaign_mapping = {val: idx for idx, val in enumerate(sorted(CAMPAIGN_TYPES))}
    region_mapping = {val: idx for idx, val in enumerate(sorted(REGIONS))}
    campaign_type_encoded = campaign_mapping[input_data.campaign_type]
    region_encoded = region_mapping[input_data.region]

    calculated_features = {
        "Google_Spend": round(float(google_val), 2),
        "Meta_Spend": round(float(meta_val), 2),
        "Microsoft_Spend": round(float(microsoft_val), 2),
        "Clicks": input_data.clicks,
        "Impressions": input_data.impressions,
        "Conversions": input_data.conversions,
        "Month": input_data.month,
        "Quarter": quarter,
        "Week": week,
        "Day": input_data.day,
        "DayOfWeek": input_data.day_of_week,
        "IsWeekend": input_data.is_weekend,
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

    # Format the row matrix to align exactly with the trained feature list order
    row_data = {}
    for col in feature_columns:
        row_data[col] = calculated_features.get(col, 0.0)

    X_pred = pd.DataFrame([row_data], columns=feature_columns)

    # 6. Predict and calculate ROAS and profit metrics
    prediction = model.predict(X_pred)[0]

    predicted_revenue = round(float(prediction), 2)
    predicted_roas = round(predicted_revenue / total_spend, 2) if total_spend > 0 else 0.0
    estimated_profit = round(predicted_revenue - total_spend, 2)
    
    prediction_time_ms = round((time.perf_counter() - start_time) * 1000.0, 4)

    return {
        "success": True,
        "predicted_revenue": predicted_revenue,
        "total_spend": round(float(total_spend), 2),
        "predicted_roas": predicted_roas,
        "estimated_profit": estimated_profit,
        "prediction_time_ms": prediction_time_ms,
        "model_version": model_info.get("version", "v3"),
        "available_channels": spend_cols
    }
