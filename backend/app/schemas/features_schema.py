"""
Features Schema — app/schemas/features_schema.py
=================================================

Pydantic schemas for feature engineering endpoint response.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class FeaturesResponse(BaseModel):
    """Response structure for POST /features endpoint."""

    success: bool = Field(..., description="Indicates if the feature engineering process was successful.")
    rows: int = Field(..., description="Total number of rows in the resulting dataset.")
    original_columns: int = Field(..., description="Number of columns in the raw input dataset.")
    new_columns: int = Field(..., description="Number of columns in the resulting feature-engineered dataset.")
    features_created: list[str] = Field(..., description="List of names of the newly constructed features.")
    saved_to: str = Field(..., description="Path to the generated feature dataset file relative to the project root.")
