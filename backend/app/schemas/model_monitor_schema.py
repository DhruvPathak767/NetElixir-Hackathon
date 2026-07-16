"""
Model Monitor Schema — app/schemas/model_monitor_schema.py
===========================================================

Pydantic schemas for the Model Monitor API (GET /model-monitor).
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from app.schemas.envelope_schema import StandardEnvelopeResponse


class ModelInformation(BaseModel):
    """General metadata of the trained model."""

    model_name: str = Field(..., description="Model identifier.")
    model_version: str = Field(..., description="Model version.")
    algorithm: str = Field(..., description="Model algorithm.")
    status: str = Field(..., description="Operational status.")
    trained: bool = Field(..., description="Trained indicator.")
    last_trained: str = Field(..., description="Last training date.")
    training_time_seconds: float = Field(..., description="Training latency.")


class DatasetInformation(BaseModel):
    """Trained features dataset statistics."""

    rows: int = Field(..., description="Total rows count.")
    columns: int = Field(..., description="Total columns count.")
    features_used: int = Field(..., description="Features count used in model.")
    target: str = Field(..., description="Target predict column.")
    missing_values: int = Field(..., description="Total missing cells.")
    duplicates: int = Field(..., description="Duplicate rows count.")


class PerformanceMetrics(BaseModel):
    """Active model validation performance metrics."""

    r2: float = Field(..., description="R2 score.")
    mae: float = Field(..., description="Mean Absolute Error.")
    rmse: float = Field(..., description="Root Mean Squared Error.")
    mape: float = Field(..., description="Mean Absolute Percentage Error.")


class CrossValidation(BaseModel):
    """Model cross validation metrics."""

    mean_r2: float = Field(..., description="Mean CV R2 score.")
    std: float = Field(..., description="CV R2 standard deviation.")
    folds: int = Field(..., description="Number of folds.")


class ModelHealth(BaseModel):
    """Model operational health score and rating."""

    score: int = Field(..., description="Operational health score (0-100).")
    rating: str = Field(..., description="Health rating level.")


class PredictionStatistics(BaseModel):
    """Execution telemetry aggregated from prediction history logs."""

    total_predictions: int = Field(..., description="Total predictions executed.")
    average_prediction_time_ms: float = Field(..., description="Average latency in ms.")
    fastest_prediction_ms: float = Field(..., description="Minimum latency in ms.")
    slowest_prediction_ms: float = Field(..., description="Maximum latency in ms.")


class FeatureImportanceItem(BaseModel):
    """Individual feature importance score."""

    feature: str = Field(..., description="Feature name.")
    importance_percentage: float = Field(..., description="Relative weight percentage.")


class ModelChecks(BaseModel):
    """Status validation of model assets loading."""

    model_loaded: bool = Field(..., description="Model loaded successfully.")
    scaler_loaded: bool = Field(..., description="Scaler loaded successfully.")
    encoder_loaded: bool = Field(..., description="Encoder loaded successfully.")
    dataset_loaded: bool = Field(..., description="Dataset loaded successfully.")


class Recommendation(BaseModel):
    """Operational recommendations."""

    status: str = Field(..., description="Operational status.")
    message: str = Field(..., description="Strategic recommendations message.")


class ModelRuntime(BaseModel):
    """Active resources and file footprint info."""

    model_size_mb: float = Field(..., description="Size of model.pkl file on disk in MB.")
    memory_usage_mb: float = Field(..., description="Process active memory usage in MB.")


class Uptime(BaseModel):
    """Predictive pipeline longevity parameters."""

    last_trained: str = Field(..., description="Last training date.")
    days_since_training: int = Field(..., description="Days elapsed since training.")
    predictions_today: int = Field(..., description="Number of predictions run today.")
    total_predictions: int = Field(..., description="Total prediction runs logged.")


class DataDrift(BaseModel):
    """Input distribution diagnostic status."""

    status: str = Field(..., description="Drift status (Stable, Warning, Critical).")
    score: int = Field(..., description="Drift score (0-100).")
    message: str = Field(..., description="Drift explanation message.")


class MonitoringScore(BaseModel):
    """Aggregate dashboard quality score."""

    score: int = Field(..., description="Composite quality score.")
    rating: str = Field(..., description="Monitoring score rating level.")


class MonitorMetadata(BaseModel):
    """Diagnostics generation metadata."""

    generated_at: str = Field(..., description="ISO 8601 creation datetime.")
    processing_time_ms: float = Field(..., description="Latency compilation time in ms.")
    api_version: str = Field("v1", description="Diagnostic API Version.")
    model_version: str = Field("v3", description="Predictive model version.")


class ModelMonitorResponse(BaseModel):
    """Response schema for model monitoring details."""

    success: bool = Field(..., description="Success indicator.")
    model_information: ModelInformation = Field(..., description="Model info.")
    dataset_information: DatasetInformation = Field(..., description="Dataset info.")
    performance_metrics: PerformanceMetrics = Field(..., description="Model metrics.")
    cross_validation: CrossValidation = Field(..., description="Cross validation info.")
    model_health: ModelHealth = Field(..., description="Model health.")
    prediction_statistics: PredictionStatistics = Field(..., description="Telemetry details.")
    feature_importance_type: str = Field("percentage", description="Format scale of feature importance weights.")
    feature_importance: list[FeatureImportanceItem] = Field(..., description="Top 10 feature importances.")
    model_checks: ModelChecks = Field(..., description="Checks results.")
    recommendation: Recommendation = Field(..., description="Strategic recommendation.")
    model_runtime: ModelRuntime = Field(..., description="Footprint resources.")
    uptime: Uptime = Field(..., description="longevity metrics.")
    data_drift: DataDrift = Field(..., description="Drift status.")
    monitoring_score: MonitoringScore = Field(..., description="Composite score.")
    metadata: MonitorMetadata = Field(..., description="API generation metadata.")
    processing_time_ms: float = Field(..., description="Legacy response processing time.")


class ModelNotTrainedResponse(BaseModel):
    """Error response schema when the model is not trained."""

    success: bool = Field(False, description="Failure indicator.")
    message: str = Field("Model not trained.", description="Details message.")


class ModelMonitorEnvelopeResponse(StandardEnvelopeResponse):
    """Enveloped response schema for Model Monitor API."""

    data: ModelMonitorResponse = Field(..., description="Model monitor diagnostics payload.")
