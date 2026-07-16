"""
Validation Response Schemas — app/schemas/validation_schema.py
===============================================================

Each Pydantic model here maps exactly to one section in the final
GET /validation/report JSON response.

Why strict schemas instead of raw dicts?
  - FastAPI validates the *output* at runtime — a wrong type from the
    service is caught immediately during development, not in production.
  - /docs auto-generates an exact JSON example the frontend team can use.
  - Every field carries a description that appears in the OpenAPI spec.
  - Pydantic v2 serialises faster than manual dict construction.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Missing Values
# ---------------------------------------------------------------------------

class MissingValueEntry(BaseModel):
    """Per-column missing-value statistics."""

    column: str = Field(..., description="Column name.")
    missing: int = Field(..., description="Number of missing (NaN/null) cells.")
    percentage: float = Field(..., description="Missing cells as % of total rows.")


# ---------------------------------------------------------------------------
# Duplicates
# ---------------------------------------------------------------------------

class DuplicateSummary(BaseModel):
    """Dataset-wide duplicate row statistics."""

    duplicate_count: int = Field(..., description="Number of fully duplicate rows.")
    duplicate_percentage: float = Field(..., description="Duplicates as % of total rows.")
    first_duplicate_rows: list[int] = Field(
        ...,
        description="Row numbers (1-indexed) of the first 20 duplicate occurrences.",
    )


# ---------------------------------------------------------------------------
# Negative Values
# ---------------------------------------------------------------------------

class NegativeValueEntry(BaseModel):
    """A single cell that contains an unexpected negative value."""

    row: int = Field(..., description="1-indexed row number in the dataset.")
    column: str = Field(..., description="Column name where the negative value was found.")
    value: float = Field(..., description="The actual negative numeric value.")


# ---------------------------------------------------------------------------
# Invalid Dates
# ---------------------------------------------------------------------------

class InvalidDateEntry(BaseModel):
    """A cell in a date column that could not be parsed."""

    row: int = Field(..., description="1-indexed row number.")
    column: str = Field(..., description="Column identified as a date column.")
    value: str | None = Field(None, description="The raw string value that failed parsing.")


# ---------------------------------------------------------------------------
# Invalid Numeric Values
# ---------------------------------------------------------------------------

class InvalidNumericEntry(BaseModel):
    """A cell in a numeric column that contains a non-numeric string."""

    row: int = Field(..., description="1-indexed row number.")
    column: str = Field(..., description="Column name.")
    value: str | None = Field(None, description="The raw invalid string (e.g. '$100', '10k', 'N/A').")


# ---------------------------------------------------------------------------
# Required Columns
# ---------------------------------------------------------------------------

class RequiredColumnsReport(BaseModel):
    """Presence check for columns that the AI model requires."""

    required: list[str] = Field(..., description="Columns that were checked.")
    present: list[str] = Field(..., description="Required columns found in the dataset.")
    missing: list[str] = Field(..., description="Required columns absent from the dataset.")
    all_present: bool = Field(..., description="True only when every required column exists.")


# ---------------------------------------------------------------------------
# Validation Summary
# ---------------------------------------------------------------------------

class ValidationSummary(BaseModel):
    """Top-level numbers shown in a dashboard card."""

    rows: int = Field(..., description="Total data rows.")
    columns: int = Field(..., description="Total columns.")
    validation_score: int = Field(..., ge=0, le=100, description="Composite score 0–100.")
    status: str = Field(..., description="Excellent / Good / Average / Poor.")
    issues_found: int = Field(..., description="Total number of individual issues detected.")


# ---------------------------------------------------------------------------
# Top-level Response
# ---------------------------------------------------------------------------

class ValidationReportResponse(BaseModel):
    """
    Complete validation report returned by GET /validation/report.

    Field order matches the documented API response format exactly.
    """

    success: bool = Field(True)
    summary: ValidationSummary
    missing_values: list[MissingValueEntry]
    duplicates: DuplicateSummary
    negative_values: list[NegativeValueEntry]
    invalid_dates: list[InvalidDateEntry]
    invalid_numeric_values: list[InvalidNumericEntry]
    empty_columns: list[str]
    required_columns: RequiredColumnsReport
    recommendations: list[str]
