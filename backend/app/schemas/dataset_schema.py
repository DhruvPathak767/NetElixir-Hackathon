"""
Dataset Response Schemas — app/schemas/dataset_schema.py
=========================================================

WHY RESPONSE SCHEMAS ARE IMPORTANT
------------------------------------

In Express.js you typically return raw objects:
    res.json({ rows: 2000, columns: 30 })

FastAPI + Pydantic lets you define *typed contracts* for responses:

    class DatasetOverview(BaseModel):
        total_rows: int
        total_columns: int

Benefits over raw dicts:
┌──────────────────────────┬──────────────────────────────────────────────┐
│ Feature                  │ Why it matters                               │
├──────────────────────────┼──────────────────────────────────────────────┤
│ Auto-validation          │ Pydantic raises an error if your service     │
│                          │ returns the wrong type — caught at dev time  │
│ OpenAPI docs             │ FastAPI generates exact JSON schema in /docs │
│ IDE autocomplete         │ Full type hints across the whole codebase    │
│ Frontend contract        │ Frontend devs know exactly what to expect    │
│ Serialisation            │ model.model_dump() gives clean JSON-safe dict│
│ Versioning               │ Easy to add/remove fields with clear diffs   │
└──────────────────────────┴──────────────────────────────────────────────┘

Node.js closest equivalent: Zod schemas or TypeScript interfaces used with
tRPC — but Pydantic does this automatically with zero extra config.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# 1. Dataset Overview
# ---------------------------------------------------------------------------

class DatasetOverview(BaseModel):
    """Top-level structural summary of the uploaded CSV file."""

    filename: str = Field(..., description="Unique saved filename on disk.")
    total_rows: int = Field(..., description="Number of data rows (excluding header).")
    total_columns: int = Field(..., description="Number of columns.")
    memory_usage: str = Field(..., description="Human-readable in-memory size of the DataFrame.")


# ---------------------------------------------------------------------------
# 2. Preview (first 10 / last 10 rows)
# ---------------------------------------------------------------------------

class DataPreview(BaseModel):
    """
    A small window into the dataset — never the full data.

    Returning only head/tail keeps the response payload small and prevents
    accidental exposure of large datasets over the wire. The AI forecasting
    engine will read the full file directly from disk when needed.
    """

    first_10_rows: list[dict[str, Any]] = Field(
        ..., description="First 10 rows of the dataset as a list of row-dicts."
    )
    last_10_rows: list[dict[str, Any]] = Field(
        ..., description="Last 10 rows of the dataset as a list of row-dicts."
    )


# ---------------------------------------------------------------------------
# 3. Column Information
# ---------------------------------------------------------------------------

class ColumnInfo(BaseModel):
    """Column-level metadata — names, types, and categorisation."""

    column_names: list[str] = Field(..., description="Ordered list of all column names.")
    total_numeric_columns: int = Field(..., description="Count of numeric (int/float) columns.")
    total_categorical_columns: int = Field(..., description="Count of string/object columns.")
    numeric_columns: list[str] = Field(..., description="Names of numeric columns.")
    categorical_columns: list[str] = Field(..., description="Names of categorical/string columns.")
    data_types: dict[str, str] = Field(
        ..., description="Mapping of column name → pandas dtype string."
    )


# ---------------------------------------------------------------------------
# 4. Data Quality Analysis
# ---------------------------------------------------------------------------

class DataQuality(BaseModel):
    """
    Quantified data quality measurements.

    These feed directly into the Health Score and later guide the AI
    preprocessing pipeline (imputation, deduplication, encoding).
    """

    total_missing_values: int = Field(..., description="Sum of all NaN/null cells across the DataFrame.")
    missing_values_per_column: dict[str, int] = Field(
        ..., description="Column → count of missing values (only columns with at least 1 missing)."
    )
    duplicate_rows: int = Field(..., description="Number of fully duplicate rows.")
    duplicate_percentage: float = Field(..., description="Duplicates as a percentage of total rows.")
    empty_columns: list[str] = Field(..., description="Columns where every single value is missing.")
    columns_with_missing_data: list[str] = Field(
        ..., description="Columns that have at least one missing value."
    )


# ---------------------------------------------------------------------------
# 5. Dataset Health Score
# ---------------------------------------------------------------------------

class DatasetHealth(BaseModel):
    """
    A single composite score (0–100) summarising overall dataset quality.

    WHY THIS IS USEFUL
    ------------------
    Raw quality metrics (missing %, duplicates, empty columns) are hard to
    interpret at a glance. A single score lets you:

    - Display a dashboard badge: "Dataset Health: 87 — Good"
    - Trigger automated warnings before running the AI model
    - Gate the forecasting pipeline: refuse to train if score < 50
    - Track quality improvement over time as the dataset is cleaned

    The AI forecasting engine will read this score and decide:
    - Score >= 75 → proceed with training
    - Score  50-74 → warn the user and apply auto-imputation
    - Score < 50  → reject and ask the user to clean the data first

    Scoring algorithm (see dataset_preview_service.py for implementation):
        Start at 100
        − up to 30 pts for missing value rate
        − up to 20 pts for duplicate row rate
        − up to 20 pts for empty columns
        − up to 15 pts for invalid numeric values
        − up to 15 pts for column type coherence
    """

    health_score: int = Field(..., ge=0, le=100, description="Composite quality score 0–100.")
    status: str = Field(..., description="One of: Excellent, Good, Average, Poor.")


# ---------------------------------------------------------------------------
# 6. Summary Statistics
# ---------------------------------------------------------------------------

class NumericColumnStats(BaseModel):
    """Descriptive statistics for a single numeric column."""

    count: float = Field(..., description="Number of non-null values.")
    mean: float = Field(..., description="Arithmetic mean.")
    median: float = Field(..., description="50th percentile.")
    std: float = Field(..., description="Standard deviation.")
    min: float = Field(..., description="Minimum value.")
    max: float = Field(..., description="Maximum value.")


class CategoricalColumnStats(BaseModel):
    """Frequency statistics for a single categorical column."""

    unique_values: int = Field(..., description="Number of distinct values.")
    top_value: str | None = Field(None, description="Most frequently occurring value.")
    top_value_frequency: int = Field(..., description="How many times the top value appears.")


class SummaryStatistics(BaseModel):
    """
    Aggregated statistics split by column type.

    HOW pandas.describe() WORKS
    ----------------------------
    df.describe() computes descriptive statistics for all numeric columns:

        df.describe()
        #            Age      Salary   Experience
        # count   1950.0    1843.0       2000.0
        # mean      38.5   95432.1         10.2
        # std       10.2   58201.3          5.6
        # min       18.0   -42118.0          0.0
        # 25%       30.0   52000.0          4.0
        # 50%       38.0   85000.0         10.0   ← median
        # 75%       47.0  130000.0         16.0
        # max       65.0  230180.0         35.0

    Under the hood, pandas calls numpy's aggregate functions (mean, std, etc.)
    on each column's non-null values. We extract count/mean/median/std/min/max
    and expose them individually so the AI model can use them directly for
    feature normalisation and outlier detection.

    For categorical columns we use df[col].value_counts() to get top value
    and unique count — equivalent to SQL's:
        SELECT col, COUNT(*) FROM table GROUP BY col ORDER BY COUNT(*) DESC LIMIT 1
    """

    numeric: dict[str, NumericColumnStats] = Field(
        default_factory=dict,
        description="Column name → descriptive stats for each numeric column.",
    )
    categorical: dict[str, CategoricalColumnStats] = Field(
        default_factory=dict,
        description="Column name → frequency stats for each categorical column.",
    )


# ---------------------------------------------------------------------------
# 7. Top-level Response Model
# ---------------------------------------------------------------------------

class DatasetPreviewResponse(BaseModel):
    """
    Complete response envelope for GET /dataset/preview.

    ARCHITECTURE COMPARISON — FastAPI vs Express.js
    -----------------------------------------------

    Express.js pattern (no schema enforcement):
    ┌─────────────────────────────────────────────────────────────────┐
    │ router.get('/dataset/preview', async (req, res) => {           │
    │   const data = await datasetService.analyse(latestFile);       │
    │   res.json({ success: true, ...data });   // raw dict, no check│
    │ });                                                             │
    └─────────────────────────────────────────────────────────────────┘

    FastAPI pattern (schema-enforced, self-documenting):
    ┌─────────────────────────────────────────────────────────────────┐
    │ @router.get("/preview", response_model=DatasetPreviewResponse) │
    │ async def preview():                                            │
    │   data = dataset_preview_service.analyse(latest_file)          │
    │   return DatasetPreviewResponse(**data)   # validated & typed  │
    └─────────────────────────────────────────────────────────────────┘

    Key differences:
    - FastAPI validates the *output* — if the service returns the wrong
      shape, it raises a 500 with a clear error during development.
    - /docs shows the exact JSON shape the client will receive.
    - response_model=... filters out any extra fields automatically.
    - Pydantic v2 is 5–10× faster than v1 for serialisation.
    """

    success: bool = Field(True, description="Always true on a successful response.")
    dataset_overview: DatasetOverview
    preview: DataPreview
    columns: ColumnInfo
    quality: DataQuality
    health: DatasetHealth
    statistics: SummaryStatistics
    available_channels: list[str] = Field(default_factory=list, description="Discovered advertising channels.")
