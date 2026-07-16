"""
System Health Schema — app/schemas/system_health_schema.py
===========================================================

Pydantic schemas for the System Health API (GET /system-health).
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from app.schemas.envelope_schema import StandardEnvelopeResponse


class ServicesStatus(BaseModel):
    """Status indicator labels for active platform modules."""

    api: str = Field(..., description="FastAPI web router state.")
    forecast_model: str = Field(..., description="ML prediction model file state.")
    recommendation_engine: str = Field(..., description="Strategic recommendations engine state.")
    budget_optimizer: str = Field(..., description="Vectorized ad spend optimization module state.")
    scenario_engine: str = Field(..., description="Growth scenarios engine state.")


class ModelStatus(BaseModel):
    """Diagnostics of predictive model loading."""

    loaded: bool = Field(..., description="Model loaded successfully.")
    version: str = Field(..., description="Predictive model version.")
    ready_for_prediction: bool = Field(..., description="Model ready to handle inference.")


class StorageDiagnostics(BaseModel):
    """File storage counts."""

    prediction_history: int = Field(..., description="Number of prediction logs.")
    recommendation_history: int = Field(..., description="Number of recommendations runs.")
    forecast_history: int = Field(..., description="Active forecast runs count.")


class PerformanceDiagnostics(BaseModel):
    """Aggregated response speed analytics."""

    average_prediction_ms: float = Field(..., description="Average forecast latency in ms.")
    average_api_response_ms: float = Field(..., description="Average complete API response time in ms.")
    fastest_prediction_ms: float = Field(..., description="Minimum prediction latency in ms.")
    slowest_prediction_ms: float = Field(..., description="Maximum prediction latency in ms.")


class SystemResources(BaseModel):
    """Operational machine resource consumption."""

    cpu_percent: float = Field(..., description="CPU utilization percentage.")
    memory_percent: float = Field(..., description="RAM memory utilization percentage.")
    disk_percent: float = Field(..., description="Storage disk utilization percentage.")


class UptimeDiagnostics(BaseModel):
    """ Longevity metrics since server startup."""

    started_at: str = Field(..., description="Server startup ISO 8601 timestamp.")
    uptime_seconds: int = Field(..., description="Uptime elapsed in seconds.")


class HealthChecks(BaseModel):
    """Validation checks status of individual assets on disk."""

    model_loaded: bool = Field(..., description="Model binary available.")
    dataset_loaded: bool = Field(..., description="Processed features dataset available.")
    encoder_loaded: bool = Field(..., description="Encoding configurations available.")
    scaler_loaded: bool = Field(..., description="Scaling configurations available.")
    histories_available: bool = Field(..., description="History databases accessible.")


class HealthRecommendation(BaseModel):
    """Operational health recommendations."""

    status: str = Field(..., description="Overall system health category.")
    message: str = Field(..., description="Summary action recommendation.")


class HealthMetadata(BaseModel):
    """Diagnostics response metadata."""

    generated_at: str = Field(..., description="ISO 8601 generation datetime.")
    api_version: str = Field("v1", description="System diagnostics API version.")


class SystemHealthResponse(BaseModel):
    """Response schema for System Health diagnostics."""

    success: bool = Field(..., description="Success indicator.")
    overall_status: str = Field(..., description="Platform status (Healthy, Warning, Critical).")
    system_health_score: int = Field(..., description="Composite system health score (0-100).")
    services: ServicesStatus = Field(..., description="Platform services state.")
    model_status: ModelStatus = Field(..., description="Predictive model info.")
    storage: StorageDiagnostics = Field(..., description="Storage statistics.")
    performance: PerformanceDiagnostics = Field(..., description="Inference speed analytics.")
    system_resources: SystemResources = Field(..., description="Host hardware usage.")
    uptime: UptimeDiagnostics = Field(..., description=" Longevity stats.")
    checks: HealthChecks = Field(..., description="Asset load diagnostics.")
    recommendation: HealthRecommendation = Field(..., description="Actionable recommendation.")
    metadata: HealthMetadata = Field(..., description="API generation metadata.")
    processing_time_ms: float = Field(..., description="Endpoint processing time in milliseconds.")


class SystemHealthEnvelopeResponse(StandardEnvelopeResponse):
    """Enveloped response schema for System Health API."""

    data: SystemHealthResponse = Field(..., description="System health diagnostics payload.")
