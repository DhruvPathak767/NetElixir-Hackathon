"""
Dataset Preview Service — app/services/dataset_preview_service.py
==================================================================

This service is the single source of truth for all dataset analysis logic.
The route (app/api/dataset.py) does nothing except call this service and
return the result — keeping the HTTP layer completely free of business logic.

WHY A DEDICATED SERVICE (not using csv_service.py)?
----------------------------------------------------
csv_service.py already handles upload-time analysis: shape, dtypes, head/tail.
This service has a different, broader responsibility:

    csv_service.py          → "What does this CSV look like structurally?"
    dataset_preview_service → "Is this dataset healthy enough for AI training?"

Mixing them would violate the Single Responsibility Principle and make both
services harder to unit-test, cache, or replace independently.

HOW THIS SERVICE FEEDS THE AI FORECASTING ENGINE
-------------------------------------------------
When the AI model training endpoint (not yet built) runs, it will:

  1. Call `get_latest_csv_path()` to find the dataset on disk.
  2. Call `analyse_dataset()` here to get the health score.
  3. Gate on health score:
       - score >= 75 → call pandas / sklearn preprocessing pipeline
       - score < 50  → reject with HTTP 422 ("Dataset too dirty to train on")
  4. Use `numeric_columns` list for feature selection.
  5. Use `missing_values_per_column` to decide imputation strategy.
  6. Use `summary_statistics` for feature normalisation (min-max or z-score).

All of this is already computed here — the AI engine just reads the result.

ARCHITECTURE vs EXPRESS.JS
---------------------------
Express approach (no service layer):
    router.get('/dataset/preview', async (req, res) => {
        const df = await readCsv(latestFile);           // ← transport logic
        const rows = df.length;                          // ← business logic
        const missing = df.filter(r => !r.name).length; // ← mixed in same fn
        res.json({ rows, missing });
    });

FastAPI clean architecture:
    # dataset.py (router)  — knows ONLY about HTTP
    @router.get("/preview", response_model=DatasetPreviewResponse)
    async def preview():
        return dataset_preview_service.analyse_dataset(path)

    # dataset_preview_service.py — knows ONLY about data
    def analyse_dataset(path) -> DatasetPreviewResponse:
        df = _load(path)
        return DatasetPreviewResponse(
            dataset_overview=_overview(df),
            quality=_quality(df),
            ...
        )
"""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any

import pandas as pd

from app.services.spend_discovery import discover_spend_columns, map_columns_dynamically

from app.schemas.dataset_schema import (
    CategoricalColumnStats,
    ColumnInfo,
    DataPreview,
    DataQuality,
    DatasetHealth,
    DatasetOverview,
    DatasetPreviewResponse,
    NumericColumnStats,
    SummaryStatistics,
)

# ---------------------------------------------------------------------------
# Module logger
# ---------------------------------------------------------------------------
# Each module gets its own named logger — this is idiomatic Python logging.
# In Express.js you'd use winston or pino: const logger = winston.child({ module: 'dataset' })
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR: Path = BACKEND_DIR / "uploads"

ENCODINGS: list[str] = ["utf-8", "latin-1", "cp1252"]

# Health score penalty weights — tuned so a moderately dirty dataset
# (10% missing, 5% duplicates, 1 empty column) scores ~70 (Average).
_PENALTY_MISSING_MAX = 30       # deducted proportionally to missing value rate
_PENALTY_DUPLICATE_MAX = 20     # deducted proportionally to duplicate rate
_PENALTY_EMPTY_COL = 10         # deducted per empty column (capped at 20)
_PENALTY_INVALID_NUMERIC = 15   # deducted if invalid numeric values detected


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_latest_csv_path() -> Path:
    """
    Return the most recently modified CSV file from the uploads directory.

    Raises
    ------
    FileNotFoundError
        When the uploads directory does not exist or contains no CSV files.
    """
    if not UPLOAD_DIR.exists():
        raise FileNotFoundError(
            f"Uploads directory not found at '{UPLOAD_DIR}'. "
            "Please upload a CSV file first."
        )

    csv_files = sorted(
        UPLOAD_DIR.glob("*.csv"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,   # newest first
    )

    if not csv_files:
        raise FileNotFoundError(
            "No CSV files found in the uploads directory. "
            "Please upload a CSV file first."
        )

    latest_upload = csv_files[0]

    # Check if a processed cleaned file exists and is newer than the latest upload
    cleaned_file = BACKEND_DIR / "processed" / "cleaned_data.csv"
    if cleaned_file.exists():
        if cleaned_file.stat().st_mtime > latest_upload.stat().st_mtime:
            logger.info("Cleaned CSV resolved (newer than latest upload): %s", cleaned_file.name)
            return cleaned_file

    logger.info("Latest CSV resolved: %s", latest_upload.name)
    return latest_upload


def analyse_dataset(file_path: Path) -> DatasetPreviewResponse:
    """
    Full dataset health analysis pipeline.

    Parameters
    ----------
    file_path : Path
        Absolute path to the CSV file to analyse.

    Returns
    -------
    DatasetPreviewResponse
        Validated Pydantic response object ready to be returned by the route.

    Raises
    ------
    ValueError
        Empty, unparseable, or undecodable CSV.
    RuntimeError
        Unexpected I/O or pandas error.
    """
    logger.info("Loading dataset: %s", file_path.name)
    df = _load_dataframe(file_path)
    logger.info(
        "Dataset loaded — %d rows × %d columns",
        df.shape[0],
        df.shape[1],
    )

    overview   = _build_overview(df, file_path.name)
    preview    = _build_preview(df)
    columns    = _build_column_info(df)
    quality    = _build_quality(df)
    health     = _build_health(df, quality)
    statistics = _build_statistics(df, columns)
    
    # Discover channels dynamically
    available_channels = discover_spend_columns(df, check_numeric=False)

    logger.info(
        "Dataset analysis complete — health score: %d (%s)",
        health.health_score,
        health.status,
    )

    return DatasetPreviewResponse(
        success=True,
        dataset_overview=overview,
        preview=preview,
        columns=columns,
        quality=quality,
        health=health,
        statistics=statistics,
        available_channels=available_channels
    )


# ---------------------------------------------------------------------------
# Private — DataFrame loading
# ---------------------------------------------------------------------------

def _load_dataframe(file_path: Path) -> pd.DataFrame:
    """
    Try each encoding in order and return the first successful parse.

    Raises ValueError for all logical errors (empty, parse failure, encoding)
    and RuntimeError for unexpected OS-level errors.
    """
    for encoding in ENCODINGS:
        try:
            df = pd.read_csv(file_path, encoding=encoding, low_memory=False)

            if df.empty:
                raise ValueError(
                    "The CSV was parsed successfully but contains no data rows."
                )
            df = map_columns_dynamically(df)
            return df

        except ValueError:
            raise   # our own guard — re-raise immediately

        except UnicodeDecodeError:
            logger.debug("Encoding %s failed for %s, trying next.", encoding, file_path.name)
            continue

        except pd.errors.EmptyDataError:
            raise ValueError("The CSV file is empty (no columns found).")

        except pd.errors.ParserError as exc:
            raise ValueError(f"The CSV file could not be parsed: {exc}") from exc

        except FileNotFoundError:
            raise ValueError(f"File not found at path: {file_path}")

        except Exception as exc:
            raise RuntimeError(
                f"Unexpected error reading CSV '{file_path.name}': {exc}"
            ) from exc

    raise ValueError(
        f"Unable to decode '{file_path.name}' with any supported encoding "
        f"({', '.join(ENCODINGS)})."
    )


# ---------------------------------------------------------------------------
# Private — Section builders
# ---------------------------------------------------------------------------

def _build_overview(df: pd.DataFrame, filename: str) -> DatasetOverview:
    """Shape + memory — the quick structural summary."""
    total_bytes = int(df.memory_usage(deep=True).sum())
    return DatasetOverview(
        filename=filename,
        total_rows=df.shape[0],
        total_columns=df.shape[1],
        memory_usage=_format_bytes(total_bytes),
    )


def _build_preview(df: pd.DataFrame) -> DataPreview:
    """
    Return the first and last 10 rows as plain Python dicts.

    We deliberately cap at 10 rows — sending the full dataset over HTTP
    is wasteful. The AI model reads the file directly from disk.
    """
    logger.debug("Generating dataset preview (head/tail 10 rows).")
    return DataPreview(
        first_10_rows=_df_to_records(df.head(10)),
        last_10_rows=_df_to_records(df.tail(10)),
    )


def _build_column_info(df: pd.DataFrame) -> ColumnInfo:
    """Classify every column as numeric or categorical."""
    # pandas select_dtypes is the idiomatic way to partition columns by kind.
    # Equivalent to: columns.filter(c => typeof dataset[0][c] === 'number')
    numeric_cols: list[str] = df.select_dtypes(
        include=["number"]
    ).columns.tolist()

    categorical_cols: list[str] = df.select_dtypes(
        exclude=["number"]
    ).columns.tolist()

    data_types: dict[str, str] = {col: str(df[col].dtype) for col in df.columns}

    return ColumnInfo(
        column_names=df.columns.tolist(),
        total_numeric_columns=len(numeric_cols),
        total_categorical_columns=len(categorical_cols),
        numeric_columns=numeric_cols,
        categorical_columns=categorical_cols,
        data_types=data_types,
    )


def _build_quality(df: pd.DataFrame) -> DataQuality:
    """
    Quantify data quality issues.

    Missing values    — df.isnull().sum()
    Duplicates        — df.duplicated().sum()
    Empty columns     — columns where ALL values are NaN
    """
    # ── Missing values ────────────────────────────────────────────────────────
    null_counts = df.isnull().sum()
    total_missing = int(null_counts.sum())

    # Only report columns that actually have missing values
    missing_per_col: dict[str, int] = {
        col: int(count)
        for col, count in null_counts.items()
        if count > 0
    }

    cols_with_missing: list[str] = list(missing_per_col.keys())

    # ── Duplicates ────────────────────────────────────────────────────────────
    dup_count = int(df.duplicated().sum())
    dup_pct = round((dup_count / len(df)) * 100, 2) if len(df) > 0 else 0.0

    # ── Empty columns (every single value is NaN) ─────────────────────────────
    empty_cols: list[str] = [
        col for col in df.columns if df[col].isnull().all()
    ]

    logger.debug(
        "Quality — missing: %d, duplicates: %d, empty cols: %d",
        total_missing,
        dup_count,
        len(empty_cols),
    )

    return DataQuality(
        total_missing_values=total_missing,
        missing_values_per_column=missing_per_col,
        duplicate_rows=dup_count,
        duplicate_percentage=dup_pct,
        empty_columns=empty_cols,
        columns_with_missing_data=cols_with_missing,
    )


def _build_health(df: pd.DataFrame, quality: DataQuality) -> DatasetHealth:
    """
    Compute a composite health score (0–100).

    Scoring algorithm:
        score = 100

        Missing value penalty  (0–30):
            missing_rate = total_missing / (rows × cols)
            penalty = min(missing_rate × 100, 30)

        Duplicate penalty  (0–20):
            penalty = min(duplicate_percentage, 20)

        Empty column penalty  (0–20):
            penalty = min(num_empty_cols × 10, 20)

        Invalid numeric penalty  (0–15):
            A column is "invalid numeric" when pandas kept it as object/string
            despite having a name that strongly suggests a number (Salary, Age…)
            OR when a genuinely numeric column contains non-finite values (inf).
            penalty = min(invalid_count × 5, 15)

    Status mapping:
        90–100 → Excellent
        75–89  → Good
        50–74  → Average
        <50    → Poor
    """
    score: float = 100.0
    total_cells = df.shape[0] * df.shape[1]

    # ── Missing value penalty ─────────────────────────────────────────────────
    if total_cells > 0:
        missing_rate = quality.total_missing_values / total_cells
        missing_penalty = min(missing_rate * 100 * 3, _PENALTY_MISSING_MAX)
        score -= missing_penalty
        logger.debug("Health — missing penalty: %.1f", missing_penalty)

    # ── Duplicate penalty ─────────────────────────────────────────────────────
    dup_penalty = min(quality.duplicate_percentage, _PENALTY_DUPLICATE_MAX)
    score -= dup_penalty
    logger.debug("Health — duplicate penalty: %.1f", dup_penalty)

    # ── Empty column penalty ──────────────────────────────────────────────────
    empty_penalty = min(len(quality.empty_columns) * _PENALTY_EMPTY_COL, 20)
    score -= empty_penalty
    logger.debug("Health — empty column penalty: %.1f", empty_penalty)

    # ── Invalid numeric penalty ───────────────────────────────────────────────
    # Count numeric columns that contain inf / -inf (non-finite but not NaN)
    invalid_numeric_count = 0
    for col in df.select_dtypes(include=["number"]).columns:
        if df[col].apply(lambda x: math.isinf(x) if pd.notnull(x) else False).any():
            invalid_numeric_count += 1

    invalid_penalty = min(invalid_numeric_count * 5, _PENALTY_INVALID_NUMERIC)
    score -= invalid_penalty
    logger.debug("Health — invalid numeric penalty: %.1f", invalid_penalty)

    # ── Final score ───────────────────────────────────────────────────────────
    final_score = max(0, round(score))

    if final_score >= 90:
        status = "Excellent"
    elif final_score >= 75:
        status = "Good"
    elif final_score >= 50:
        status = "Average"
    else:
        status = "Poor"

    logger.info("Health score: %d — %s", final_score, status)
    return DatasetHealth(health_score=final_score, status=status)


def _build_statistics(df: pd.DataFrame, columns: ColumnInfo) -> SummaryStatistics:
    """
    Compute descriptive statistics split by column type.

    Numeric  → pandas describe() + median
    Category → value_counts() top-1 + nunique()

    pandas.describe() computes all aggregates in a single vectorised pass
    over the column — it is significantly faster than calling mean(), std()
    etc. individually, especially for large DataFrames.
    """
    numeric_stats: dict[str, NumericColumnStats] = {}
    categorical_stats: dict[str, CategoricalColumnStats] = {}

    # ── Numeric columns ───────────────────────────────────────────────────────
    if columns.numeric_columns:
        # describe() returns a DataFrame indexed by stat name
        desc = df[columns.numeric_columns].describe()
        # median is the 50th percentile from describe()
        medians = df[columns.numeric_columns].median(numeric_only=True)

        for col in columns.numeric_columns:
            try:
                numeric_stats[col] = NumericColumnStats(
                    count=_safe_float(desc.loc["count", col]),
                    mean=_safe_float(desc.loc["mean", col]),
                    median=_safe_float(medians[col]),
                    std=_safe_float(desc.loc["std", col]),
                    min=_safe_float(desc.loc["min", col]),
                    max=_safe_float(desc.loc["max", col]),
                )
            except Exception:
                # Skip columns that can't be summarised (all-NaN, etc.)
                logger.debug("Skipping stats for numeric column '%s'.", col)
                continue

    # ── Categorical columns ───────────────────────────────────────────────────
    for col in columns.categorical_columns:
        try:
            series = df[col].dropna()
            vc = series.value_counts()
            categorical_stats[col] = CategoricalColumnStats(
                unique_values=int(series.nunique()),
                top_value=str(vc.index[0]) if len(vc) > 0 else None,
                top_value_frequency=int(vc.iloc[0]) if len(vc) > 0 else 0,
            )
        except Exception:
            logger.debug("Skipping stats for categorical column '%s'.", col)
            continue

    logger.debug(
        "Statistics computed — %d numeric, %d categorical.",
        len(numeric_stats),
        len(categorical_stats),
    )

    return SummaryStatistics(numeric=numeric_stats, categorical=categorical_stats)


# ---------------------------------------------------------------------------
# Private — Utilities
# ---------------------------------------------------------------------------

def _df_to_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Convert a DataFrame slice to a JSON-safe list of dicts."""
    records = df.where(pd.notnull(df), other=None).to_dict(orient="records")
    return [
        {k: _sanitise(v) for k, v in row.items()}
        for row in records
    ]


def _sanitise(value: Any) -> Any:
    """Coerce numpy/pandas scalars to JSON-serialisable Python primitives."""
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(value, "item"):          # numpy scalar → Python scalar
        return value.item()
    return value


def _safe_float(value: Any) -> float:
    """Return a finite float or 0.0 for NaN/inf (keeps Pydantic happy)."""
    try:
        f = float(value)
        return f if math.isfinite(f) else 0.0
    except (TypeError, ValueError):
        return 0.0


def _format_bytes(num_bytes: int) -> str:
    """Human-readable byte count string."""
    for unit in ("B", "KB", "MB", "GB"):
        if num_bytes < 1024:
            return f"{num_bytes:.1f} {unit}"
        num_bytes /= 1024
    return f"{num_bytes:.1f} TB"
