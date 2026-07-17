"""
Preprocessing Service — app/services/preprocessing_service.py
==============================================================

Single responsibility: take the latest raw CSV from uploads/, apply a
production-level deterministic cleaning pipeline, and save the result to
processed/cleaned_data.csv.

No ML, no feature engineering, no forecasting — only data cleaning.

PIPELINE ORDER (matters — later steps depend on earlier ones)
-------------------------------------------------------------
  1.  Load CSV (encoding-fallback: UTF-8 → latin-1 → cp1252)
  2.  Strip whitespace from every string cell and column header
  3.  Auto-detect column roles (date / numeric / categorical)
  4.  Convert date columns to datetime (errors → NaT); count invalid dates
  5.  Parse & coerce numeric KPI columns
        a. Strip $, commas, trailing whitespace
        b. Convert shorthand: "10k" → 10000, "1.5M" → 1500000
        c. errors="coerce" → non-numeric → NaN; count invalid numerics
  6.  Handle missing values
        Numeric   → fill with column median
        Categorical → fill with column mode
        Date       → forward-fill (propagate last valid value)
  7.  Fix negative values
        Google/Meta/Microsoft_Spend → replace with abs(value)
        Revenue                     → replace negative with median Revenue
  8.  Remove duplicate rows
  9.  Standardise text columns (Campaign_Type, Region) → strip + title-case
  10. Enforce business rules
        a. Conversions must not exceed Clicks → clip to Clicks
        b. Revenue must exceed Total_Spend
           → if not: Revenue = Total_Spend × uniform(2.8, 5.2)
  11. Detect & clip outliers using the IQR method
  12. Save cleaned DataFrame to processed/cleaned_data.csv

WHY A SERVICE LAYER?
--------------------
The route (api/preprocessing.py) does nothing except:
    1. Find the file
    2. Call this service
    3. Return the JSON result

All decisions about *how* to clean live here. This means:
  - The cleaning logic is unit-testable without an HTTP client.
  - A future background worker or CLI script can call preprocess() directly.
  - Swapping pandas for polars later only touches this file.

Express.js analogy:
    // preprocessingController.js  ← thin, HTTP only
    exports.run = async (req, res) => {
        const result = await preprocessingService.run(latestFile);
        res.json(result);
    };

    // preprocessingService.js     ← all logic
    exports.run = async (filePath) => { ... };
"""

from __future__ import annotations

import logging
import random
import re
from pathlib import Path

import numpy as np
import pandas as pd

from app.services.spend_discovery import discover_spend_columns, generate_and_save_mapping, map_columns_dynamically
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path constants
# ---------------------------------------------------------------------------
# Both paths resolved relative to this file:
#   preprocessing_service.py → services/ → app/ → backend/
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR: Path = BACKEND_DIR / "uploads"
PROCESSED_DIR: Path = BACKEND_DIR / "processed"
OUTPUT_FILE: Path = PROCESSED_DIR / "cleaned_data.csv"

# ---------------------------------------------------------------------------
# Encoding fallback list — same strategy used across all services
# ---------------------------------------------------------------------------
ENCODINGS: list[str] = ["utf-8", "latin-1", "cp1252"]

# ---------------------------------------------------------------------------
# Columns that MUST be coerced to numeric regardless of what pandas inferred.
# These are the marketing KPIs the forecasting model will train on.
# ---------------------------------------------------------------------------
NUMERIC_COLUMNS: list[str] = [
    "Google_Spend",
    "Meta_Spend",
    "Microsoft_Spend",
    "Revenue",
    "Clicks",
    "Impressions",
    "Conversions",
]

# Spend columns that must never be negative (abs() applied).
SPEND_COLUMNS: list[str] = ["Google_Spend", "Meta_Spend", "Microsoft_Spend"]

# ---------------------------------------------------------------------------
# Text columns that need standardised casing for groupby / model encoding.
# Title-case ensures "east", "EAST", "  East  " all become "East".
# ---------------------------------------------------------------------------
TEXT_STANDARDISE_COLUMNS: list[str] = [
    "Campaign_Type",
    "Region",
]

# ---------------------------------------------------------------------------
# IQR multiplier for outlier clipping.
# 1.5 = standard Tukey fence; 3.0 = only extreme outliers.
# ---------------------------------------------------------------------------
IQR_MULTIPLIER: float = 1.5

# ---------------------------------------------------------------------------
# Shorthand unit multipliers (case-insensitive suffix match)
# ---------------------------------------------------------------------------
_UNIT_MAP: dict[str, float] = {
    "k": 1_000.0,
    "m": 1_000_000.0,
    "b": 1_000_000_000.0,
}
_SHORTHAND_RE = re.compile(r"^([+-]?[\d,]*\.?\d+)\s*([kmb])$", re.IGNORECASE)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def preprocess(paths: UserPaths) -> dict:
    """
    Run the full production-level preprocessing pipeline on the latest CSV.

    Returns
    -------
    dict with keys:
        success                      bool   – always True on success
        rows_before                  int    – row count of raw dataset
        rows_after                   int    – row count after cleaning
        columns                      int    – column count
        missing_values_fixed         int    – cells imputed
        negative_values_fixed        int    – negative cells corrected
        invalid_dates_fixed          int    – date cells coerced to NaT then ffilled
        invalid_numeric_fixed        int    – non-numeric cells coerced then imputed
        duplicates_removed           int    – exact duplicate rows dropped
        outliers_corrected           int    – cells clipped by IQR
        validation_score_improvement str    – estimated score delta
        saved_to                     str    – relative path of output file

    Raises
    ------
    FileNotFoundError  No CSV found in uploads/ directory.
    ValueError         CSV is empty, undecodable, or cannot be parsed.
    RuntimeError       Unexpected OS-level or pandas error.
    """
    # ── Step 1: Load ──────────────────────────────────────────────────────────
    file_path = _resolve_latest_csv(paths)
    logger.info("Preprocessing started — source: %s", file_path.name)

    df = _load_dataframe(file_path)
    rows_before = len(df)
    logger.info("Loaded %d rows × %d columns", *df.shape)

    # ── Step 2: Strip whitespace (headers + every string cell) ────────────────
    df = _strip_whitespace(df)
    logger.info("Whitespace stripped.")

    # ── Step 2.5: Discover spend columns and save mapping ────────────────────
    spend_cols = discover_spend_columns(df, check_numeric=False)
    if not spend_cols:
        raise ValueError("No spend columns detected.")
    generate_and_save_mapping(spend_cols, paths)
    
    # Construct dynamic list of numeric columns to coerce
    dynamic_numeric_cols = [c for c in NUMERIC_COLUMNS if c not in ["Google_Spend", "Meta_Spend", "Microsoft_Spend"]] + spend_cols

    # ── Step 3: Auto-detect column roles ──────────────────────────────────────
    date_cols = _detect_date_columns(df)
    logger.info("Date columns detected: %s", date_cols)

    # ── Step 4: Convert date columns → datetime; track invalid cells ──────────
    df, invalid_dates_fixed = _convert_date_columns(df, date_cols)
    logger.info("Date conversion — invalid dates (→ NaT): %d", invalid_dates_fixed)

    # ── Step 5: Parse numeric KPI columns ─────────────────────────────────────
    #   a. Currency symbols + commas stripped
    #   b. Shorthand expanded (10k → 10000)
    #   c. errors="coerce" → NaN; count them
    df, invalid_numeric_fixed = _convert_numeric_columns(df, dynamic_numeric_cols)
    logger.info("Numeric conversion — invalid cells coerced: %d", invalid_numeric_fixed)

    # ── Step 6: Impute missing values ─────────────────────────────────────────
    missing_before = int(df.isnull().sum().sum())
    df = _handle_missing_values(df, date_cols)
    missing_after  = int(df.isnull().sum().sum())
    missing_values_fixed = missing_before - missing_after
    logger.info("Missing values — before: %d, fixed: %d", missing_before, missing_values_fixed)

    # ── Step 7: Fix negative values ───────────────────────────────────────────
    df, negative_values_fixed = _fix_negative_values(df, spend_cols)
    logger.info("Negative values fixed: %d", negative_values_fixed)

    # ── Step 8: Remove duplicate rows ─────────────────────────────────────────
    df, duplicates_removed = _remove_duplicates(df)
    logger.info("Duplicates removed: %d", duplicates_removed)

    # ── Step 9: Standardise text columns (trim + title-case) ──────────────────
    df = _standardise_text_columns(df)
    logger.info("Text columns standardised.")

    # ── Step 10: Business-rule enforcement ────────────────────────────────────
    df = _enforce_business_rules(df, spend_cols)
    logger.info("Business rules enforced.")

    # ── Step 11: IQR outlier clipping ─────────────────────────────────────────
    df, outliers_corrected = _clip_outliers(df)
    logger.info("Outliers clipped: %d cells", outliers_corrected)

    # ── Step 11.5: Final duplicate row cleanup ────────────────────────────────
    df, post_clean_dupes = _remove_duplicates(df)
    duplicates_removed += post_clean_dupes
    logger.info("Final duplicate cleanup — removed: %d rows", post_clean_dupes)

    # ── Step 12: Save cleaned dataset ─────────────────────────────────────────
    saved_to = _save_cleaned_dataset(df, paths)
    logger.info("Cleaned dataset saved to: %s", saved_to)

    # ── Estimate validation score improvement ─────────────────────────────────
    score_improvement = _estimate_score_improvement(
        missing_fixed=missing_values_fixed,
        negatives_fixed=negative_values_fixed,
        dupes_removed=duplicates_removed,
        invalid_dates=invalid_dates_fixed,
        invalid_numerics=invalid_numeric_fixed,
        rows_before=rows_before,
    )

    return {
        "success":                    True,
        "rows_before":                rows_before,
        "rows_after":                 len(df),
        "columns":                    df.shape[1],
        "missing_values_fixed":       missing_values_fixed,
        "negative_values_fixed":      negative_values_fixed,
        "invalid_dates_fixed":        invalid_dates_fixed,
        "invalid_numeric_fixed":      invalid_numeric_fixed,
        "duplicates_removed":         duplicates_removed,
        "outliers_corrected":         outliers_corrected,
        "validation_score_improvement": score_improvement,
        "saved_to":                   saved_to,
    }


# ---------------------------------------------------------------------------
# Private — File helpers
# ---------------------------------------------------------------------------

def _resolve_latest_csv(paths: UserPaths) -> Path:
    """
    Return the path of the most recently modified CSV in uploads/.
    """
    if not paths.uploads_dir.exists():
        raise FileNotFoundError(
            f"Uploads directory not found at '{paths.uploads_dir}'. "
            "Please upload a CSV file first."
        )

    csv_files = sorted(
        paths.uploads_dir.glob("*.csv"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    if not csv_files:
        raise FileNotFoundError(
            "No CSV files found in the uploads directory. "
            "Please upload a dataset before running preprocessing."
        )

    return csv_files[0]


def _load_dataframe(file_path: Path) -> pd.DataFrame:
    """
    Read a CSV with encoding fallback: UTF-8 → latin-1 → cp1252.

    Raises ValueError for empty / unparseable files.
    Raises RuntimeError for unexpected OS errors.
    """
    for encoding in ENCODINGS:
        try:
            df = pd.read_csv(file_path, encoding=encoding, low_memory=False)

            if df.empty:
                raise ValueError(
                    "The CSV was parsed but contains no data rows."
                )
            df = map_columns_dynamically(df)
            return df

        except ValueError:
            raise  # our own guard

        except UnicodeDecodeError:
            logger.debug("Encoding '%s' failed, trying next.", encoding)
            continue

        except pd.errors.EmptyDataError:
            raise ValueError("The CSV file is empty (no columns found).")

        except pd.errors.ParserError as exc:
            raise ValueError(f"CSV parse error: {exc}") from exc

        except FileNotFoundError:
            raise ValueError(f"File not found: {file_path}")

        except Exception as exc:
            raise RuntimeError(
                f"Unexpected error reading '{file_path.name}': {exc}"
            ) from exc

    raise ValueError(
        f"Cannot decode '{file_path.name}' with any of: {', '.join(ENCODINGS)}."
    )


def _save_cleaned_dataset(df: pd.DataFrame, paths: UserPaths) -> str:
    """
    Write the cleaned DataFrame to processed/cleaned_data.csv.
    """
    paths.processed_dir.mkdir(parents=True, exist_ok=True)

    try:
        df.to_csv(paths.cleaned_data_file, index=False, encoding="utf-8")
    except PermissionError as exc:
        raise ValueError(
            f"Permission denied: The target file '{paths.cleaned_data_file.name}' is locked "
            "by another application (most likely Microsoft Excel). Please close Excel and try again."
        ) from exc

    # Return path relative to backend root for a clean JSON response.
    return str(paths.cleaned_data_file.relative_to(BACKEND_DIR))


# ---------------------------------------------------------------------------
# Private — Cleaning steps
# ---------------------------------------------------------------------------

def _strip_whitespace(df: pd.DataFrame) -> pd.DataFrame:
    """
    Step 2 — Strip leading/trailing whitespace from:
      - Column headers  (e.g. "  Region  " → "Region")
      - Every string/object cell in the DataFrame
    """
    # Strip column names
    df.columns = df.columns.str.strip()

    # Map column names case-insensitively to standard expected names
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
    new_columns = []
    for col in df.columns:
        col_norm = col.lower().replace(" ", "_")
        if col_norm in lower_map:
            new_columns.append(lower_map[col_norm])
        else:
            new_columns.append(col)
    df.columns = new_columns

    # Strip all string-typed cells
    str_cols = [
        col for col in df.columns
        if pd.api.types.is_string_dtype(df[col])
    ]
    for col in str_cols:
        df[col] = df[col].str.strip()

    return df


def _detect_date_columns(df: pd.DataFrame) -> list[str]:
    """
    Step 3 — Heuristic detection of date columns.

    A column is a date column when:
      - pandas already inferred it as datetime64, OR
      - Its name contains a date keyword and its dtype is string/object
    """
    date_keywords = {"date", "dob", "birth", "hired", "joined", "time"}
    detected: list[str] = []

    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            detected.append(col)
            continue
        if pd.api.types.is_string_dtype(df[col]) and any(
            kw in col.lower() for kw in date_keywords
        ):
            detected.append(col)

    return detected


def _convert_date_columns(
    df: pd.DataFrame, date_cols: list[str]
) -> tuple[pd.DataFrame, int]:
    """
    Step 4 — Convert detected date columns to pandas datetime.

    errors="coerce" turns unparseable values into NaT.
    We count NaT cells created here as 'invalid_dates_fixed' — they will
    be filled by forward-fill in step 6.
    """
    invalid_count = 0
    for col in date_cols:
        if col not in df.columns:
            continue
        before_na = int(df[col].isnull().sum())
        df[col] = pd.to_datetime(df[col], errors="coerce", dayfirst=False)
        after_na  = int(df[col].isnull().sum())
        # New NaT values = values that were non-null strings but unparseable
        invalid_count += max(0, after_na - before_na)
        logger.debug("Column '%s' converted to datetime.", col)

    return df, invalid_count


def _parse_shorthand(value: str) -> float | None:
    """
    Convert shorthand numeric strings to float.

    Examples:
        "10k"   → 10000.0
        "15K"   → 15000.0
        "1.5M"  → 1500000.0
        "2B"    → 2000000000.0
        "$50000" → handled by _clean_numeric_string (currency strip first)
        "TBD"   → None (not a shorthand)

    Returns None when the value cannot be parsed as a shorthand.
    """
    match = _SHORTHAND_RE.match(value.strip())
    if not match:
        return None
    number_str, suffix = match.group(1), match.group(2).lower()
    try:
        number = float(number_str.replace(",", ""))
        return number * _UNIT_MAP[suffix]
    except ValueError:
        return None


def _clean_numeric_string(raw: str) -> str:
    """
    Normalise a raw string for numeric coercion:
      1. Strip leading/trailing whitespace
      2. Remove currency symbols ($, £, €, ₹)
      3. Remove thousands commas:  "1,234.56" → "1234.56"
      4. Expand shorthand:         "10k" → "10000"
    Returns the cleaned string (may still be non-numeric, e.g. "TBD").
    """
    s = raw.strip()

    # Remove currency symbols
    s = re.sub(r"[$£€₹]", "", s)

    # Remove commas used as thousands separators
    # Careful: only remove commas between digits, not "1,2,3" style garbage
    s = re.sub(r"(?<=\d),(?=\d)", "", s)

    # Expand shorthand (10k, 1.5M, etc.)
    parsed = _parse_shorthand(s)
    if parsed is not None:
        return str(parsed)

    return s


def _convert_numeric_columns(
    df: pd.DataFrame,
    numeric_cols: list[str],
) -> tuple[pd.DataFrame, int]:
    """
    Step 5 — Coerce KPI columns to float64 with full cleaning.
    """
    invalid_count = 0

    for col in numeric_cols:
        if col not in df.columns:
            logger.debug("Numeric column '%s' not found — skipping.", col)
            continue

        # Only apply string cleaning to string-dtype columns.
        # If pandas already inferred float64/int64 (clean data), skip string ops.
        if pd.api.types.is_string_dtype(df[col]) or df[col].dtype == object:
            df[col] = df[col].apply(
                lambda v: _clean_numeric_string(str(v))
                if isinstance(v, str) and v.strip() not in ("nan", "None", "")
                else v
            )

        before_na = int(df[col].isnull().sum())
        df[col] = pd.to_numeric(df[col], errors="coerce")
        after_na  = int(df[col].isnull().sum())
        invalid_count += max(0, after_na - before_na)

        logger.debug("Column '%s' coerced to numeric (new NaN: %d).", col, max(0, after_na - before_na))

    return df, invalid_count


def _handle_missing_values(df: pd.DataFrame, date_cols: list[str]) -> pd.DataFrame:
    """
    Step 6 — Impute missing values by column type.

    Strategy:
      Numeric columns   → fill with column median
                          Median is preferred over mean for financial data
                          because it is robust to outliers (e.g. a spike month).
      Categorical cols  → fill with column mode (most frequent value)
                          This preserves the dominant category distribution.
      Date columns      → forward-fill (ffill)
                          Propagates the last valid date forward, which is
                          appropriate for time-series data where gaps mean
                          "same as previous period".
    """
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    # String dtype covers both legacy object and StringDtype
    string_cols = [
        col for col in df.columns
        if pd.api.types.is_string_dtype(df[col]) and col not in date_cols
    ]

    # Numeric → median
    for col in numeric_cols:
        if df[col].isnull().any():
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            logger.debug("Column '%s' — NaN filled with median %.4f", col, median_val)

    # Categorical → mode
    for col in string_cols:
        if df[col].isnull().any():
            mode_series = df[col].mode()
            if not mode_series.empty:
                df[col] = df[col].fillna(mode_series.iloc[0])
                logger.debug("Column '%s' — NaN filled with mode '%s'", col, mode_series.iloc[0])

    # Date → forward fill
    for col in date_cols:
        if col in df.columns and df[col].isnull().any():
            df[col] = df[col].ffill()
            logger.debug("Column '%s' — NaT forward-filled.", col)

    return df


def _fix_negative_values(df: pd.DataFrame, spend_cols: list[str]) -> tuple[pd.DataFrame, int]:
    """
    Step 7 — Correct economically invalid negative values.
    """
    fixed = 0

    # Spend columns → abs()
    for col in spend_cols:
        if col not in df.columns:
            continue
        neg_mask = df[col] < 0
        count = int(neg_mask.sum())
        if count:
            df.loc[neg_mask, col] = df.loc[neg_mask, col].abs()
            fixed += count
            logger.debug("Column '%s' — %d negative values replaced with abs().", col, count)

    # Revenue → median imputation for negatives
    if "Revenue" in df.columns:
        neg_mask = df["Revenue"] < 0
        count = int(neg_mask.sum())
        if count:
            revenue_median = df.loc[~neg_mask, "Revenue"].median()
            df.loc[neg_mask, "Revenue"] = revenue_median
            fixed += count
            logger.debug(
                "Revenue — %d negative values replaced with median %.2f.",
                count, revenue_median,
            )

    logger.info("Negative values fixed total: %d", fixed)
    return df, fixed


def _remove_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """
    Step 8 — Drop fully duplicate rows.

    keep="first" retains the first occurrence and removes subsequent ones.
    The count of removed rows is returned so it can be included in the
    API response.

    Returns (cleaned_df, number_of_removed_rows).
    """
    original_len = len(df)
    df = df.drop_duplicates(keep="first").reset_index(drop=True)
    removed = original_len - len(df)
    return df, removed


def _standardise_text_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Step 9 — Normalise casing in text columns.

    For Campaign_Type and Region:
      - Strip any remaining whitespace
      - Apply title-case: "SHOPPING" → "Shopping", "east" → "East"

    Uses is_string_dtype() to cover both legacy object and StringDtype.
    """
    for col in TEXT_STANDARDISE_COLUMNS:
        if col not in df.columns:
            continue
        if pd.api.types.is_string_dtype(df[col]):
            df[col] = df[col].str.strip().str.title()
            logger.debug("Column '%s' — title-cased.", col)

    return df


def _enforce_business_rules(df: pd.DataFrame, spend_cols: list[str]) -> pd.DataFrame:
    """
    Step 10 — Enforce marketing-domain business constraints.
    """
    # ── Rule A: Conversions ≤ Clicks ─────────────────────────────────────────
    if "Conversions" in df.columns and "Clicks" in df.columns:
        bad_mask = df["Conversions"] > df["Clicks"]
        bad_count = int(bad_mask.sum())
        if bad_count:
            df.loc[bad_mask, "Conversions"] = df.loc[bad_mask, "Clicks"]
            logger.info("Business rule A — Conversions clipped to Clicks: %d rows", bad_count)

    # ── Rule B: Revenue > Total_Spend ────────────────────────────────────────
    spend_cols_present = [c for c in spend_cols if c in df.columns]
    if "Revenue" in df.columns and spend_cols_present:
        total_spend = df[spend_cols_present].sum(axis=1)
        bad_mask = df["Revenue"] <= total_spend

        bad_count = int(bad_mask.sum())
        if bad_count:
            # Vectorised random multipliers — one per bad row
            multipliers = pd.Series(
                [random.uniform(2.8, 5.2) for _ in range(bad_count)],
                index=df.index[bad_mask],
            )
            df.loc[bad_mask, "Revenue"] = (total_spend[bad_mask] * multipliers).astype(df["Revenue"].dtype)
            logger.info(
                "Business rule B — Revenue recalculated for %d rows (ROAS 2.8–5.2x)",
                bad_count,
            )

    return df


def _clip_outliers(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """
    Step 11 — Clip outliers using the Interquartile Range (IQR) method.

    For each numeric column:
        Q1  = 25th percentile
        Q3  = 75th percentile
        IQR = Q3 - Q1
        Lower fence = Q1 - IQR_MULTIPLIER × IQR
        Upper fence = Q3 + IQR_MULTIPLIER × IQR

    Any value outside [lower_fence, upper_fence] is clipped to the fence.
    Clipping (rather than dropping) preserves row count and prevents data
    loss — the extreme value is replaced with the nearest valid boundary.

    IQR_MULTIPLIER = 1.5 (standard Tukey fence). Increase to 3.0 for a
    more lenient policy that only catches extreme outliers.

    We skip the Date column and categorical columns — IQR is only meaningful
    for continuous numeric data.

    Returns (cleaned_df, total_cells_clipped).
    """
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    total_clipped = 0

    for col in numeric_cols:
        q1  = df[col].quantile(0.25)
        q3  = df[col].quantile(0.75)
        iqr = q3 - q1

        if iqr == 0:
            # All values identical — no meaningful outlier detection possible
            continue

        lower = q1 - IQR_MULTIPLIER * iqr
        upper = q3 + IQR_MULTIPLIER * iqr

        outlier_mask = (df[col] < lower) | (df[col] > upper)
        count = int(outlier_mask.sum())

        if count:
            df[col] = df[col].clip(lower=lower, upper=upper)
            total_clipped += count
            logger.debug(
                "Column '%s' — %d outliers clipped to [%.2f, %.2f]",
                col, count, lower, upper,
            )

    return df, total_clipped


# ---------------------------------------------------------------------------
# Private — Score estimation
# ---------------------------------------------------------------------------

def _estimate_score_improvement(
    *,
    missing_fixed: int,
    negatives_fixed: int,
    dupes_removed: int,
    invalid_dates: int,
    invalid_numerics: int,
    rows_before: int,
) -> str:
    """
    Produce a human-readable estimate of how much the validation score
    improved after preprocessing.

    This is a heuristic — not a precise recalculation. It mirrors the
    penalty weights defined in validation_service._calculate_score():
      - missing values   → up to +15 pts
      - duplicates       → up to +10 pts
      - negative values  → up to +20 pts
      - invalid dates    → up to +20 pts
      - invalid numerics → up to +10 pts
    """
    gain: float = 0.0

    # Missing values gain (proportional to what was fixed)
    if rows_before > 0 and missing_fixed > 0:
        gain += min(15.0, (missing_fixed / max(rows_before, 1)) * 150)

    # Duplicate gain (proportional)
    if rows_before > 0 and dupes_removed > 0:
        dup_pct = (dupes_removed / rows_before) * 100
        gain += min(10.0, dup_pct)

    # Negative values (binary: any negatives fixed = full penalty recovered)
    if negatives_fixed > 0:
        gain += min(20.0, negatives_fixed * 5)

    # Invalid dates
    if invalid_dates > 0:
        gain += min(20.0, invalid_dates * 0.5)

    # Invalid numerics
    if invalid_numerics > 0:
        gain += min(10.0, invalid_numerics * 1.0)

    gain = round(min(gain, 75.0))   # cap — can't gain more than max penalty total

    return f"+{gain} points (estimated)"
