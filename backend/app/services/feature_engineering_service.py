"""
Feature Engineering Service — app/services/feature_engineering_service.py
========================================================================

Single responsibility: load processed/cleaned_data.csv, construct time features,
spend ratio features, marketing KPIs, categorical label encodings, and rolling/lag
historical columns, and write the resulting dataset to processed/features.csv.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

from app.services.spend_discovery import discover_spend_columns, load_channel_mapping
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path constants
# ---------------------------------------------------------------------------
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
INPUT_FILE: Path = BACKEND_DIR / "processed" / "cleaned_data.csv"
OUTPUT_FILE: Path = BACKEND_DIR / "processed" / "features.csv"


def generate_features(paths: UserPaths) -> dict[str, Any]:
    """
    Load cleaned_data.csv, execute feature engineering steps, and save to features.csv.

    Returns
    -------
    dict
        Metadata summarizing the feature engineering results.
    """
    logger.info("Starting feature engineering process.")

    # 1. Load the cleaned dataset
    if not paths.cleaned_data_file.exists():
        raise FileNotFoundError(
            f"Cleaned dataset not found at '{paths.cleaned_data_file}'. "
            "Please run preprocessing first."
        )

    # Read the dataset
    df = pd.read_csv(paths.cleaned_data_file)
    
    # Normalize headers case-insensitively to standard expected names
    standard_map = {
        "date": "Date",
        "campaign_type": "Campaign_Type",
        "region": "Region",
        "google_spend": "Google_Spend",
        "meta_spend": "Meta_Spend",
        "microsoft_spend": "Microsoft_Spend",
        "clicks": "Clicks",
        "impressions": "Impressions",
        "conversions": "Conversions",
        "revenue": "Revenue"
    }
    lower_map = {k.lower(): v for k, v in standard_map.items()}
    df.columns = [lower_map.get(col.lower().replace(" ", "_"), col) for col in df.columns]

    original_rows = len(df)
    original_cols_count = df.shape[1]
    logger.info("Loaded dataset with %d rows and %d columns.", original_rows, original_cols_count)

    # 2. Ensure date column is parsed for time-based features
    # Sort chronologically by Date first so historical lags and rolling means are correctly aligned
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values("Date").reset_index(drop=True)

    new_features: list[str] = []

    # ── Time Features ────────────────────────────────────────────────────────
    logger.info("Generating time features.")
    df["Month"] = df["Date"].dt.month
    df["Quarter"] = df["Date"].dt.quarter
    df["Week"] = df["Date"].dt.isocalendar().week.astype(int)
    df["Day"] = df["Date"].dt.day
    df["DayOfWeek"] = df["Date"].dt.dayofweek
    df["IsWeekend"] = df["Date"].dt.dayofweek.isin([5, 6]).astype(int)

    time_features = ["Month", "Quarter", "Week", "Day", "DayOfWeek", "IsWeekend"]
    new_features.extend(time_features)

    # ── Spend Features ───────────────────────────────────────────────────────
    logger.info("Generating spend features.")
    
    # Load channel mapping
    mapping_payload = load_channel_mapping(paths)
    spend_cols = mapping_payload.get("spend_columns", [])
    mapping = mapping_payload.get("mapping", {})
    
    # Sum all discovered spend columns for Total_Spend
    df["Total_Spend"] = df[spend_cols].sum(axis=1)
    
    # Initialize standard model input columns
    df["Google_Spend"] = 0.0
    df["Meta_Spend"] = 0.0
    df["Microsoft_Spend"] = 0.0
    df["Google_Share"] = 0.0
    df["Meta_Share"] = 0.0
    df["Microsoft_Share"] = 0.0
    
    # Map discovered columns to standard model input columns
    for original_col, model_col in mapping.items():
        if original_col in df.columns:
            df[model_col] = df[original_col]
            df[model_col + "_Share"] = np.where(df["Total_Spend"] > 0, df[original_col] / df["Total_Spend"], 0.0)

    spend_features = ["Total_Spend", "Google_Share", "Meta_Share", "Microsoft_Share"]
    new_features.extend(spend_features)

    # ── Marketing KPIs ───────────────────────────────────────────────────────
    logger.info("Generating marketing KPI features.")
    df["ROAS"] = np.where(df["Total_Spend"] > 0, df["Revenue"] / df["Total_Spend"], 0.0)
    df["CTR"] = np.where(df["Impressions"] > 0, df["Clicks"] / df["Impressions"], 0.0)
    df["CPC"] = np.where(df["Clicks"] > 0, df["Total_Spend"] / df["Clicks"], 0.0)
    df["CPM"] = np.where(df["Impressions"] > 0, (df["Total_Spend"] / df["Impressions"]) * 1000.0, 0.0)
    df["Conversion_Rate"] = np.where(df["Clicks"] > 0, df["Conversions"] / df["Clicks"], 0.0)
    df["Revenue_Per_Click"] = np.where(df["Clicks"] > 0, df["Revenue"] / df["Clicks"], 0.0)

    kpi_features = ["ROAS", "CTR", "CPC", "CPM", "Conversion_Rate", "Revenue_Per_Click"]
    new_features.extend(kpi_features)

    # ── Historical Features (Lags & Rolling) ─────────────────────────────────
    logger.info("Generating historical lag and rolling window features.")
    df["Revenue_Lag_1"] = df["Revenue"].shift(1)
    df["Revenue_Lag_7"] = df["Revenue"].shift(7)
    df["Rolling_Revenue_7"] = df["Revenue"].rolling(window=7, min_periods=1).mean()
    df["Rolling_Revenue_30"] = df["Revenue"].rolling(window=30, min_periods=1).mean()
    df["Rolling_Spend_7"] = df["Total_Spend"].rolling(window=7, min_periods=1).mean()

    historical_features = [
        "Revenue_Lag_1",
        "Revenue_Lag_7",
        "Rolling_Revenue_7",
        "Rolling_Revenue_30",
        "Rolling_Spend_7"
    ]
    new_features.extend(historical_features)

    # ── Categorical Encoding ──────────────────────────────────────────────────
    logger.info("Encoding categorical columns using LabelEncoder.")
    
    le_campaign = LabelEncoder()
    df["Campaign_Type_Encoded"] = le_campaign.fit_transform(df["Campaign_Type"].astype(str))
    
    le_region = LabelEncoder()
    df["Region_Encoded"] = le_region.fit_transform(df["Region"].astype(str))

    encoding_features = ["Campaign_Type_Encoded", "Region_Encoded"]
    new_features.extend(encoding_features)

    # ── Cleaning and Formatting ──────────────────────────────────────────────
    # Replace inf and -inf values with 0
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.fillna(0.0)

    # Round decimal columns (float) to 2 decimal places
    float_cols = df.select_dtypes(include=[np.number]).columns
    df[float_cols] = df[float_cols].round(2)

    # Ensure Date column is output in YYYY-MM-DD string format
    df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")

    # 3. Save the result
    try:
        paths.processed_dir.mkdir(parents=True, exist_ok=True)
        df.to_csv(paths.features_file, index=False)
    except PermissionError as exc:
        raise ValueError(
            f"Permission denied: The target file '{paths.features_file.name}' is locked "
            "by another application (most likely Microsoft Excel). Please close Excel and try again."
        ) from exc
    logger.info("Saved feature engineered dataset to '%s'.", paths.features_file)

    # Format the feature list as requested (excluding the shares from the features_created
    # list to strictly match the requested JSON format, but keeping them in df if generated, 
    # or returning the exact list of generated features). Let's list exactly what was requested 
    # in the return JSON example.
    features_to_list = [
        "Month",
        "Quarter",
        "Week",
        "Day",
        "DayOfWeek",
        "IsWeekend",
        "Total_Spend",
        "ROAS",
        "CTR",
        "CPC",
        "CPM",
        "Conversion_Rate",
        "Revenue_Per_Click",
        "Revenue_Lag_1",
        "Revenue_Lag_7",
        "Rolling_Revenue_7",
        "Rolling_Revenue_30",
        "Rolling_Spend_7",
        "Campaign_Type_Encoded",
        "Region_Encoded"
    ]

    return {
        "success": True,
        "rows": len(df),
        "original_columns": original_cols_count,
        "new_columns": df.shape[1],
        "features_created": features_to_list,
        "saved_to": str(paths.features_file.relative_to(BACKEND_DIR)).replace("\\", "/")
    }
