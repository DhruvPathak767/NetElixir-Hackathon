"""
CSV Validation Service — app/services/validation_service.py
============================================================

This service is the single source of truth for all validation logic.
It is completely independent of FastAPI — no HTTPException, no Request,
no Response. The router delegates here and only handles HTTP concerns.

RESPONSIBILITY SPLIT
--------------------
    validation_service.py   → "Are the values inside the dataset correct?"
    dataset_preview_service → "What does the dataset look like structurally?"
    csv_service.py          → "Read and return raw metadata after upload."

REUSE STRATEGY
--------------
`get_latest_csv_path()` already exists in dataset_preview_service and is the
single authoritative way to resolve the newest upload. We import it directly
rather than duplicating the file-finding logic.

HOW THIS FEEDS THE AI FORECASTING ENGINE
-----------------------------------------
Before training, the engine will:
  1. Call generate_validation_report(path) to get the ValidationReportResponse.
  2. Gate on validation_score:
       >= 80  → clean enough, proceed with training
       60-79  → warn user, apply auto-corrections (impute, strip negatives)
       < 60   → block training, surface specific issues as actionable errors
  3. Use missing_values list to pick imputation strategy per column.
  4. Use negative_values list to clamp or drop invalid rows.
  5. Use invalid_dates list to trigger date-parsing pre-processor.

ARCHITECTURE vs EXPRESS.JS
---------------------------
Express (no service layer):
    router.get('/validation/report', async (req, res) => {
        const df = readCsv(latestFile);
        const missing = df.columns.map(col => ({ col, count: df[col].nullCount() }));
        const dupes = df.duplicates().count();
        // ... 200 more lines mixed with HTTP logic
        res.json({ missing, dupes, ... });
    });

FastAPI clean architecture:
    # validation.py (router)       — HTTP only, ~30 lines
    @router.get("/report", response_model=ValidationReportResponse)
    async def report():
        path = get_latest_csv_path()
        return validation_service.generate_validation_report(path)

    # validation_service.py        — all business logic, HTTP-free
    def generate_validation_report(path) -> ValidationReportResponse: ...
"""

from __future__ import annotations

import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from app.services.spend_discovery import map_columns_dynamically

from app.schemas.validation_schema import (
    DuplicateSummary,
    InvalidDateEntry,
    InvalidNumericEntry,
    MissingValueEntry,
    NegativeValueEntry,
    RequiredColumnsReport,
    ValidationReportResponse,
    ValidationSummary,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ENCODINGS: list[str] = ["utf-8", "latin-1", "cp1252"]

# Columns that MUST be present for the AI forecasting model to function.
REQUIRED_COLUMNS: list[str] = ["Date", "Revenue"]

# Column name keywords that must never contain negative values.
# Checked case-insensitively against column names.
NEGATIVE_VALUE_KEYWORDS: list[str] = ["spend", "budget", "revenue", "cost"]

# Patterns that indicate a value looks numeric but is not parseable as float.
# Ordered from most specific to least specific for fast short-circuit.
_INVALID_NUMERIC_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"^\$[\d,]+(\.\d+)?$"),         # $100 or $1,234.56
    re.compile(r"^[\d,]+(\.\d+)?[kKmMbB]$"),   # 10k, 1.5M, 2B
    re.compile(r"^-{2,}$"),                     # -- or ---
    re.compile(r"^(n/?a|na|nan|null|none|#n/a|#na)$", re.IGNORECASE),  # N/A variants
    re.compile(r"^[a-zA-Z][\w\s]*$"),           # pure text like "abc", "Unknown"
]

# Date format strings tried in order when parsing a date-column value.
# Each tuple is (strptime_format, human_description).
_DATE_FORMATS: list[tuple[str, str]] = [
    ("%Y-%m-%d",    "YYYY-MM-DD"),
    ("%d/%m/%Y",    "DD/MM/YYYY"),
    ("%m-%d-%Y",    "MM-DD-YYYY"),
    ("%m/%d/%Y",    "MM/DD/YYYY"),
    ("%B %d, %Y",   "Month DD, YYYY"),   # January 25, 1991
    ("%B %d %Y",    "Month DD YYYY"),    # January 25 1991
    ("%d-%m-%Y",    "DD-MM-YYYY"),
    ("%Y/%m/%d",    "YYYY/MM/DD"),
]

# Keywords that strongly suggest a column holds dates.
_DATE_COLUMN_KEYWORDS: list[str] = ["date", "dob", "birth", "hired", "joined"]

# Validation score penalty weights (per the spec).
_SCORE_PENALTY = {
    "missing":          15,
    "duplicates":       10,
    "negative":         20,
    "invalid_dates":    20,
    "required_missing": 25,
    "invalid_numeric":  10,
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_validation_report(file_path: Path) -> ValidationReportResponse:
    """
    Run the full validation pipeline on a CSV file and return a typed report.

    Parameters
    ----------
    file_path : Path
        Absolute path to the CSV file (newest upload).

    Returns
    -------
    ValidationReportResponse
        Validated Pydantic model — ready for FastAPI to serialise.

    Raises
    ------
    ValueError
        CSV is empty, unparseable, or undecodable.
    RuntimeError
        Unexpected OS-level or pandas error.
    """
    logger.info("Starting validation for: %s", file_path.name)

    df = _load_dataframe(file_path)
    logger.info("Dataset loaded — %d rows × %d columns", *df.shape)

    # Run every validation rule independently.
    missing_values     = _check_missing_values(df)
    duplicates         = _check_duplicates(df)
    negative_values    = _check_negative_values(df)
    invalid_dates      = _check_invalid_dates(df)
    invalid_numerics   = _check_invalid_numerics(df)
    empty_columns      = _check_empty_columns(df)
    required_columns   = _check_required_columns(df)

    # Build composite score.
    score = _calculate_score(
        df=df,
        missing_values=missing_values,
        duplicates=duplicates,
        negative_values=negative_values,
        invalid_dates=invalid_dates,
        invalid_numerics=invalid_numerics,
        required_columns=required_columns,
    )

    status = _score_to_status(score)

    # Count all distinct issues.
    issues_found = (
        len(missing_values)       # columns with missing data
        + duplicates.duplicate_count
        + len(negative_values)
        + len(invalid_dates)
        + len(invalid_numerics)
        + len(empty_columns)
        + len(required_columns.missing)
    )

    recommendations = _build_recommendations(
        missing_values=missing_values,
        duplicates=duplicates,
        negative_values=negative_values,
        invalid_dates=invalid_dates,
        invalid_numerics=invalid_numerics,
        empty_columns=empty_columns,
        required_columns=required_columns,
    )

    summary = ValidationSummary(
        rows=df.shape[0],
        columns=df.shape[1],
        validation_score=score,
        status=status,
        issues_found=issues_found,
    )

    logger.info(
        "Validation complete — score: %d (%s), issues: %d",
        score, status, issues_found,
    )

    return ValidationReportResponse(
        success=True,
        summary=summary,
        missing_values=missing_values,
        duplicates=duplicates,
        negative_values=negative_values,
        invalid_dates=invalid_dates,
        invalid_numeric_values=invalid_numerics,
        empty_columns=empty_columns,
        required_columns=required_columns,
        recommendations=recommendations,
    )


# ---------------------------------------------------------------------------
# Private — CSV loading (reuses same encoding-fallback strategy as other services)
# ---------------------------------------------------------------------------

def _load_dataframe(file_path: Path) -> pd.DataFrame:
    """
    Read CSV with encoding fallback (UTF-8 → latin-1 → cp1252).

    Raises ValueError for all logical errors, RuntimeError for OS failures.
    """
    for encoding in ENCODINGS:
        try:
            df = pd.read_csv(file_path, encoding=encoding, low_memory=False)
            if df.empty:
                raise ValueError("The CSV was parsed but contains no data rows.")
            df = map_columns_dynamically(df)
            return df

        except ValueError:
            raise

        except UnicodeDecodeError:
            logger.debug("Encoding %s failed, trying next.", encoding)
            continue

        except pd.errors.EmptyDataError:
            raise ValueError("The CSV file is empty (no columns found).")

        except pd.errors.ParserError as exc:
            raise ValueError(f"CSV parse error: {exc}") from exc

        except FileNotFoundError:
            raise ValueError(f"File not found: {file_path}")

        except Exception as exc:
            raise RuntimeError(f"Unexpected error reading '{file_path.name}': {exc}") from exc

    raise ValueError(
        f"Cannot decode '{file_path.name}' with any supported encoding "
        f"({', '.join(ENCODINGS)})."
    )


# ---------------------------------------------------------------------------
# Private — Validation rules
# ---------------------------------------------------------------------------

def _check_missing_values(df: pd.DataFrame) -> list[MissingValueEntry]:
    """
    Rule 1 — Missing Values.

    For every column that has at least one NaN, compute count + percentage.
    Columns with zero missing values are omitted to keep the report lean.
    """
    total_rows = len(df)
    entries: list[MissingValueEntry] = []

    for col in df.columns:
        missing_count = int(df[col].isnull().sum())
        if missing_count == 0:
            continue
        pct = round((missing_count / total_rows) * 100, 2) if total_rows else 0.0
        entries.append(MissingValueEntry(column=col, missing=missing_count, percentage=pct))

    logger.debug("Missing values check — %d columns affected.", len(entries))
    return entries


def _check_duplicates(df: pd.DataFrame) -> DuplicateSummary:
    """
    Rule 2 — Duplicate Rows.

    A duplicate is a row where every column value exactly matches another row.
    We return the 1-indexed row numbers of the first 20 duplicate occurrences
    so the user can verify them in their spreadsheet.
    """
    dup_mask = df.duplicated(keep="first")
    dup_count = int(dup_mask.sum())
    dup_pct = round((dup_count / len(df)) * 100, 2) if len(df) else 0.0

    # Convert 0-indexed positions to 1-indexed row numbers (skip header).
    dup_row_numbers: list[int] = [
        int(i) + 2  # +1 for 0-index→1-index, +1 for header row
        for i in df.index[dup_mask].tolist()[:20]
    ]

    logger.debug("Duplicates check — %d found.", dup_count)
    return DuplicateSummary(
        duplicate_count=dup_count,
        duplicate_percentage=dup_pct,
        first_duplicate_rows=dup_row_numbers,
    )


def _check_negative_values(df: pd.DataFrame) -> list[NegativeValueEntry]:
    """
    Rule 3 — Negative Values in financial columns.

    Only checks columns whose name contains any of the NEGATIVE_VALUE_KEYWORDS
    (case-insensitive). For each such column we first try to coerce values to
    float, then flag rows where the numeric value < 0.

    We coerce because the dataset can have strings like '$-42118' or '-42118'.
    """
    entries: list[NegativeValueEntry] = []

    target_cols = [
        col for col in df.columns
        if any(kw in col.lower() for kw in NEGATIVE_VALUE_KEYWORDS)
    ]

    for col in target_cols:
        # Strip common currency symbols and commas before coercion.
        numeric_series = pd.to_numeric(
            df[col].astype(str).str.replace(r"[$,\s]", "", regex=True),
            errors="coerce",
        )

        neg_mask = numeric_series < 0
        for idx in df.index[neg_mask]:
            entries.append(NegativeValueEntry(
                row=int(idx) + 2,       # 1-indexed + header offset
                column=col,
                value=float(numeric_series.at[idx]),
            ))

    logger.debug("Negative values check — %d instances found.", len(entries))
    return entries


def _check_invalid_dates(df: pd.DataFrame) -> list[InvalidDateEntry]:
    """
    Rule 4 — Invalid Date Detection.

    Auto-detect date columns by keyword match on column name, then attempt
    to parse each non-null value against all known date formats. Any value
    that fails all formats is flagged.

    We avoid pd.to_datetime(infer=True) here because it silently coerces
    invalid dates (e.g. "February 31") to NaT without telling us *which*
    rows failed. Iterating gives precise row-level reporting.
    """
    date_cols = [
        col for col in df.columns
        if any(kw in col.lower() for kw in _DATE_COLUMN_KEYWORDS)
    ]

    entries: list[InvalidDateEntry] = []

    for col in date_cols:
        for idx, raw_val in df[col].items():
            # Skip genuinely missing values — those are a separate issue.
            if pd.isnull(raw_val):
                continue

            raw_str = str(raw_val).strip()
            if not raw_str:
                continue

            if not _parse_date(raw_str):
                entries.append(InvalidDateEntry(
                    row=int(idx) + 2,
                    column=col,
                    value=raw_str,
                ))

    logger.debug("Invalid dates check — %d instances found.", len(entries))
    return entries


def _check_invalid_numerics(df: pd.DataFrame) -> list[InvalidNumericEntry]:
    """
    Rule 5 — Invalid Numeric Values.

    Targets columns where pandas inferred dtype as object/string but the
    column name or content suggest it should be numeric (e.g. Salary, Age,
    Experience_Years).

    Strategy:
      1. Look at object-typed columns with numeric-sounding names.
      2. For each non-null cell, try float conversion after stripping symbols.
      3. If conversion fails AND the value matches a known invalid pattern,
         flag it.

    We only check object columns because genuinely numeric columns (int64,
    float64) cannot contain string garbage — pandas would have already raised
    or coerced them to NaN.
    """
    # Keywords that suggest a column should be numeric.
    _NUMERIC_NAME_KEYWORDS = [
        "salary", "age", "experience", "bonus", "rating",
        "attendance", "balance", "phone", "postal", "code",
    ]

    target_cols = [
        col for col in df.select_dtypes(include=["object"]).columns
        if any(kw in col.lower() for kw in _NUMERIC_NAME_KEYWORDS)
    ]

    entries: list[InvalidNumericEntry] = []

    for col in target_cols:
        for idx, raw_val in df[col].items():
            if pd.isnull(raw_val):
                continue

            raw_str = str(raw_val).strip()
            if not raw_str:
                continue

            # Try to parse as a number after stripping currency/formatting.
            cleaned = re.sub(r"[$,\s]", "", raw_str)
            try:
                float(cleaned)
                # Successfully parsed — not an issue.
            except ValueError:
                # Cannot be converted. Flag if it matches a known bad pattern.
                if _matches_invalid_numeric_pattern(raw_str):
                    entries.append(InvalidNumericEntry(
                        row=int(idx) + 2,
                        column=col,
                        value=raw_str,
                    ))

    logger.debug("Invalid numerics check — %d instances found.", len(entries))
    return entries


def _check_empty_columns(df: pd.DataFrame) -> list[str]:
    """
    Rule 6 — Empty Columns.

    A column is considered empty when every single value is NaN/null.
    These columns contribute zero information and waste memory.
    """
    empty = [col for col in df.columns if df[col].isnull().all()]
    logger.debug("Empty columns: %s", empty)
    return empty


def _check_required_columns(df: pd.DataFrame) -> RequiredColumnsReport:
    """
    Rule 7 — Required Columns.

    The AI forecasting engine needs at minimum a Date column and a Revenue
    column. We do a case-insensitive partial match so 'Hire_Date' satisfies
    'Date' and 'Monthly_Revenue' satisfies 'Revenue'.
    """
    from app.services.spend_discovery import discover_spend_columns
    
    actual_lower = {col.lower(): col for col in df.columns}

    present: list[str] = []
    missing: list[str] = []

    for required in REQUIRED_COLUMNS:
        # Partial, case-insensitive match.
        found = any(required.lower() in col_lower for col_lower in actual_lower)
        if found:
            present.append(required)
        else:
            missing.append(required)

    # Also verify that at least one spend column is present
    spend_cols = discover_spend_columns(df, check_numeric=False)
    required_list = REQUIRED_COLUMNS + ["Spend Column (e.g., Google Spend)"]
    if spend_cols:
        present.append("Spend Column (e.g., Google Spend)")
    else:
        missing.append("Spend Column (e.g., Google Spend)")

    logger.debug("Required columns — present: %s, missing: %s", present, missing)
    return RequiredColumnsReport(
        required=required_list,
        present=present,
        missing=missing,
        all_present=len(missing) == 0,
    )


# ---------------------------------------------------------------------------
# Private — Scoring
# ---------------------------------------------------------------------------

def _calculate_score(
    df: pd.DataFrame,
    missing_values: list[MissingValueEntry],
    duplicates: DuplicateSummary,
    negative_values: list[NegativeValueEntry],
    invalid_dates: list[InvalidDateEntry],
    invalid_numerics: list[InvalidNumericEntry],
    required_columns: RequiredColumnsReport,
) -> int:
    """
    Compute a composite validation score (0–100) using penalty deductions.

    Penalties are proportional where possible so a dataset with 1 missing
    row doesn't score the same as one with 50% missing data.

    Algorithm:
        score = 100

        Missing values  (−0 to −15):
            rate = total_missing_cells / (rows × cols)
            penalty = min(rate × 150, 15)   # 10% missing → −15

        Duplicates  (−0 to −10):
            penalty = min(dup_pct, 10)

        Negative values  (−0 to −20):
            If any detected → −20 (binary: either the column has negatives or not)
            Scaled: min(count × 2, 20)

        Invalid dates  (−0 to −20):
            Scaled: min(count × 0.5, 20)

        Invalid numerics  (−0 to −10):
            Scaled: min(count × 1, 10)

        Required columns  (−25 per missing required column):
            penalty = len(missing_required) × 25 (capped at 25)
    """
    score: float = 100.0

    # ── Missing values ────────────────────────────────────────────────────────
    total_cells = df.shape[0] * df.shape[1]
    total_missing = sum(e.missing for e in missing_values)
    if total_cells > 0 and total_missing > 0:
        rate = total_missing / total_cells
        score -= min(rate * 150, _SCORE_PENALTY["missing"])

    # ── Duplicates ────────────────────────────────────────────────────────────
    score -= min(duplicates.duplicate_percentage, _SCORE_PENALTY["duplicates"])

    # ── Negative values ───────────────────────────────────────────────────────
    if negative_values:
        score -= min(len(negative_values) * 2, _SCORE_PENALTY["negative"])

    # ── Invalid dates ─────────────────────────────────────────────────────────
    if invalid_dates:
        score -= min(len(invalid_dates) * 0.5, _SCORE_PENALTY["invalid_dates"])

    # ── Invalid numerics ──────────────────────────────────────────────────────
    if invalid_numerics:
        score -= min(len(invalid_numerics) * 1.0, _SCORE_PENALTY["invalid_numeric"])

    # ── Required columns ──────────────────────────────────────────────────────
    score -= min(len(required_columns.missing) * 25, _SCORE_PENALTY["required_missing"])

    return max(0, round(score))


def _score_to_status(score: int) -> str:
    """Map a numeric score to its human-readable status label."""
    if score >= 95:
        return "Excellent"
    if score >= 80:
        return "Good"
    if score >= 60:
        return "Average"
    return "Poor"


# ---------------------------------------------------------------------------
# Private — Recommendations
# ---------------------------------------------------------------------------

def _build_recommendations(
    missing_values: list[MissingValueEntry],
    duplicates: DuplicateSummary,
    negative_values: list[NegativeValueEntry],
    invalid_dates: list[InvalidDateEntry],
    invalid_numerics: list[InvalidNumericEntry],
    empty_columns: list[str],
    required_columns: RequiredColumnsReport,
) -> list[str]:
    """
    Generate actionable, plain-English recommendations ordered by severity.

    Each recommendation is a single sentence so it can be displayed directly
    in a dashboard notification or email alert.
    """
    recs: list[str] = []

    # Required columns — highest priority (blocks AI training entirely).
    for col in required_columns.missing:
        recs.append(
            f"Add the required '{col}' column — the AI forecasting model "
            f"cannot run without it."
        )

    # Duplicates.
    if duplicates.duplicate_count > 0:
        recs.append(
            f"Remove {duplicates.duplicate_count} duplicate rows "
            f"({duplicates.duplicate_percentage}% of dataset) to prevent "
            f"model overfitting."
        )

    # Missing values — one recommendation per badly affected column (>5% missing).
    high_missing = [e for e in missing_values if e.percentage >= 5.0]
    for entry in high_missing[:5]:   # cap at 5 to avoid recommendation spam
        recs.append(
            f"Fill or impute missing values in '{entry.column}' "
            f"({entry.missing} cells, {entry.percentage}% missing)."
        )

    # Summarise lightly-missing columns as a group.
    low_missing = [e for e in missing_values if e.percentage < 5.0]
    if low_missing:
        col_names = ", ".join(e.column for e in low_missing[:4])
        if len(low_missing) > 4:
            col_names += f" and {len(low_missing) - 4} more"
        recs.append(
            f"Address minor missing values in: {col_names}."
        )

    # Negative values.
    if negative_values:
        affected_cols = list({e.column for e in negative_values})
        recs.append(
            f"Replace or remove {len(negative_values)} negative value(s) in "
            f"{', '.join(affected_cols)} — financial columns should not be negative."
        )

    # Invalid dates.
    if invalid_dates:
        affected_cols = list({e.column for e in invalid_dates})
        recs.append(
            f"Correct {len(invalid_dates)} unparseable date(s) in "
            f"{', '.join(affected_cols)} — standardise to YYYY-MM-DD format."
        )

    # Invalid numeric values.
    if invalid_numerics:
        affected_cols = list({e.column for e in invalid_numerics})
        recs.append(
            f"Fix {len(invalid_numerics)} invalid numeric value(s) in "
            f"{', '.join(affected_cols)} (e.g. '$100', '10k', 'N/A' should be plain numbers)."
        )

    # Empty columns.
    if empty_columns:
        recs.append(
            f"Drop or populate the {len(empty_columns)} completely empty "
            f"column(s): {', '.join(empty_columns)}."
        )

    return recs


# ---------------------------------------------------------------------------
# Private — Helpers
# ---------------------------------------------------------------------------

def _parse_date(value: str) -> bool:
    """
    Return True if `value` can be parsed by any of the known date formats.

    We try strptime over each format string rather than dateutil.parse
    to remain dependency-free and to avoid accepting nonsensical strings
    that dateutil would happily parse (e.g. plain integers).
    """
    for fmt, _ in _DATE_FORMATS:
        try:
            datetime.strptime(value, fmt)
            return True
        except ValueError:
            continue
    return False


def _matches_invalid_numeric_pattern(value: str) -> bool:
    """
    Return True if `value` looks like it was *intended* to be a number
    but is formatted in a way that prevents direct numeric parsing.

    Examples that return True:  '$100', '10k', '--', 'N/A', 'abc'
    Examples that return False: '42', '3.14', '-7', '' (empty)
    """
    return any(pattern.match(value) for pattern in _INVALID_NUMERIC_PATTERNS)
