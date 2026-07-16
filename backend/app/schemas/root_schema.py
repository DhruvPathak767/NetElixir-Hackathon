"""
Root API Schema — app/schemas/root_schema.py
===========================================

Pydantic schemas for the Root Endpoint (GET /api).
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from app.schemas.envelope_schema import StandardEnvelopeResponse


class RootPayload(BaseModel):
    """Detailed project status and metadata."""

    project_name: str = Field("AI Marketing Forecasting System", description="Name of the platform.")
    description: str = Field(..., description="Platform description.")
    api_version: str = Field(..., description="Active API version.")
    model_version: str = Field(..., description="Active model version.")
    system_status: str = Field(..., description="Global system status.")
    available_apis: list[str] = Field(..., description="List of exposed endpoints.")


class RootEnvelopeResponse(StandardEnvelopeResponse):
    """Enveloped response schema for the Root API."""

    data: RootPayload = Field(..., description="Project root status information.")
