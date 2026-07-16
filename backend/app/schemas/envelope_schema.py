"""
Response Envelope Schema — app/schemas/envelope_schema.py
=========================================================

Standardized production envelope schema for all system API responses.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field
from app.core import config


class ResponseMetadata(BaseModel):
    """Execution metadata included in standard responses."""

    generated_at: str = Field(..., description="ISO 8601 generation datetime.")
    processing_time_ms: float = Field(..., description="API execution processing time in milliseconds.")
    api_version: str = Field(config.API_VERSION, description="System API Version.")
    model_version: str = Field(config.MODEL_VERSION, description="Active ML Model Version.")


class StandardEnvelopeResponse(BaseModel):
    """Standardized API wrapper envelope."""

    success: bool = Field(..., description="Boolean indicating successful query completion.")
    status: str = Field("success", description="Status string (e.g. success, error).")
    message: str = Field(..., description="Summary narrative detail of the operation.")
    data: Any = Field(..., description="Response payload structure.")
    metadata: ResponseMetadata = Field(..., description="Execution performance diagnostics metadata.")
