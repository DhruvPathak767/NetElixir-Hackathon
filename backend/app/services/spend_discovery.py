"""
Spend Discovery Helper — app/services/spend_discovery.py
=======================================================
Dynamically discovers advertising channels (spend columns) and creates
a persistent deterministic mapping to expected LightGBM model spend inputs.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

from app.core.user_paths import UserPaths

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
MAPPING_FILE = BACKEND_DIR / "processed" / "channel_mapping.json"

SPEND_KEYWORDS = [
    "spend", "cost", "budget", "investment", "ads", 
    "ad spend", "media spend", "marketing spend", "campaign spend"
]

def discover_spend_columns(df: pd.DataFrame, check_numeric: bool = True) -> list[str]:
    """
    Scan every column in df and return the ones matching spend keywords.
    """
    spend_cols = []
    # If check_numeric is true, only search numeric columns
    cols_to_check = df.select_dtypes(include=[np.number]).columns if check_numeric else df.columns
    
    for col in df.columns:
        if col in cols_to_check:
            col_lower = col.lower()
            if any(kw in col_lower for kw in SPEND_KEYWORDS):
                # Avoid duplicates
                if col not in spend_cols:
                    spend_cols.append(col)
    return spend_cols

def generate_and_save_mapping(spend_cols: list[str], paths: UserPaths = None) -> dict[str, Any]:
    """
    Create a deterministic mapping from discovered channels to Google_Spend,
    Meta_Spend, and Microsoft_Spend, and save to processed/channel_mapping.json.
    """
    MAPPING_FILE_LOCAL = paths.channel_mapping_file if paths else MAPPING_FILE
    if not spend_cols:
        raise ValueError("No spend columns detected.")

    # Find standard columns first
    std_google = None
    std_meta = None
    std_microsoft = None

    for col in spend_cols:
        col_lower = col.lower().replace(" ", "_")
        if col_lower == "google_spend":
            std_google = col
        elif col_lower == "meta_spend":
            std_meta = col
        elif col_lower == "microsoft_spend":
            std_microsoft = col

    mapping = {}
    remaining_cols = [c for c in spend_cols if c not in (std_google, std_meta, std_microsoft)]

    # Map Google Spend
    if std_google:
        mapping[std_google] = "Google_Spend"
    elif remaining_cols:
        mapping[remaining_cols.pop(0)] = "Google_Spend"

    # Map Meta Spend
    if std_meta:
        mapping[std_meta] = "Meta_Spend"
    elif remaining_cols:
        mapping[remaining_cols.pop(0)] = "Meta_Spend"

    # Map Microsoft Spend
    if std_microsoft:
        mapping[std_microsoft] = "Microsoft_Spend"
    elif remaining_cols:
        mapping[remaining_cols.pop(0)] = "Microsoft_Spend"

    # Save to file
    payload = {
        "spend_columns": spend_cols,
        "mapping": mapping
    }

    try:
        MAPPING_FILE_LOCAL.parent.mkdir(parents=True, exist_ok=True)
        with open(MAPPING_FILE_LOCAL, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=4)
        logger.info("Saved deterministic channel mapping to %s", MAPPING_FILE_LOCAL)
    except Exception as exc:
        logger.warning("Failed to save channel mapping file: %s", exc)

    return payload

def load_channel_mapping(paths: UserPaths = None) -> dict[str, Any]:
    """
    Load the persistent deterministic mapping from processed/channel_mapping.json.
    Fallback to standard mapping if not found.
    """
    MAPPING_FILE_LOCAL = paths.channel_mapping_file if paths else MAPPING_FILE
    if MAPPING_FILE_LOCAL.exists():
        try:
            with open(MAPPING_FILE_LOCAL, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.warning("Error reading channel mapping file: %s", exc)
            
    # Default fallback
    return {
        "spend_columns": ["Google_Spend", "Meta_Spend", "Microsoft_Spend"],
        "mapping": {
            "Google_Spend": "Google_Spend",
            "Meta_Spend": "Meta_Spend",
            "Microsoft_Spend": "Microsoft_Spend"
        }
    }


def map_columns_dynamically(df: pd.DataFrame) -> pd.DataFrame:
    """
    Rename columns dynamically if standard marketing columns are missing.
    """
    col_map = {}
    
    # Mapping table for fallbacks:
    fallbacks = {
        "Date": ["date", "hire_date", "date_of_birth", "dob", "birth", "hired", "joined", "timestamp", "time"],
        "Revenue": ["revenue", "salary", "income", "sales", "earnings"],
        "Google_Spend": ["google_spend", "bonus", "spend", "cost", "budget", "investment", "ads"],
        "Clicks": ["clicks", "experience_years", "experience", "years"],
        "Impressions": ["impressions", "attendance_percentage", "attendance"],
        "Conversions": ["conversions", "performance_rating", "performance"],
        "Campaign_Type": ["campaign_type", "department", "dept", "job_title", "title"],
        "Region": ["region", "office_city", "city", "state", "country"]
    }
    
    # Map columns
    for target, alts in fallbacks.items():
        target_lower = target.lower().replace(" ", "_")
        found = False
        
        # First check if the standard column name already exists in df
        for col in df.columns:
            if col.lower().replace(" ", "_") == target_lower:
                col_map[col] = target
                found = True
                break
                
        if not found:
            # Look for alternatives in the fallback list
            for alt in alts:
                alt_lower = alt.lower().replace(" ", "_")
                for col in df.columns:
                    if col.lower().replace(" ", "_") == alt_lower:
                        col_map[col] = target
                        found = True
                        break
                if found:
                    break
                    
    # Rename columns in df
    if col_map:
        df = df.rename(columns=col_map)
        
    return df
