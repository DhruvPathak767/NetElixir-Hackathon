"""
Model Training Schema — app/schemas/model_training_schema.py
=============================================================

Pydantic schemas for the model training and informational endpoint responses.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class MetricsResponse(BaseModel):
    """Evaluation metrics for the trained model."""

    r2: float = Field(..., description="R-squared (coefficient of determination) value, rounded to 4 decimals.")
    mae: float = Field(..., description="Mean Absolute Error, rounded to 4 decimals.")
    rmse: float = Field(..., description="Root Mean Squared Error, rounded to 4 decimals.")
    mape: float = Field(..., description="Mean Absolute Percentage Error (in percentage, e.g. 5.82 for 5.82%), rounded to 4 decimals.")


class CrossValidationMetrics(BaseModel):
    """Metrics from the K-Fold Cross Validation."""

    fold_scores: list[float] = Field(..., description="R-squared score for each cross-validation fold.")
    mean_r2: float = Field(..., description="Mean R-squared score across all folds.")
    std: float = Field(..., description="Standard deviation of R-squared scores across all folds.")


class ModelTrainingResponse(BaseModel):
    """Response structure for POST /train-model endpoint."""

    success: bool = Field(..., description="Indicates if the model training process was successful.")
    rows: int = Field(..., description="Total number of rows in the loaded dataset.")
    features_used: int = Field(..., description="Number of features used for training.")
    target: str = Field(..., description="Name of the target variable.")
    training_time: float = Field(..., description="Training duration in seconds.")
    model_verified: bool = Field(..., description="Indicates if the trained model was successfully reloaded and verified.")
    model_version: str = Field(..., description="Version of the trained model.")
    cross_validation: CrossValidationMetrics = Field(..., description="Cross-validation results.")
    metrics: MetricsResponse = Field(..., description="Evaluation metrics of the trained model on the test set.")


class FeatureImportanceItem(BaseModel):
    """A single feature and its computed importance score."""

    feature: str = Field(..., description="Feature name.")
    importance: float = Field(..., description="Importance value/score.")


class FeatureImportanceResponse(BaseModel):
    """Response structure for GET /model/feature-importance endpoint."""

    success: bool = Field(..., description="Indicates if the retrieval was successful.")
    top_features: list[FeatureImportanceItem] = Field(..., description="Sorted list of features and their importances.")


class ModelStatusResponse(BaseModel):
    """Response structure for GET /model/status endpoint."""

    model_exists: bool = Field(..., description="Indicates if the model is trained and available.")
    model_version: str | None = Field(default=None, description="Model version.")
    trained_at: str | None = Field(default=None, description="Timestamp when the model was trained.")
    feature_count: int | None = Field(default=None, description="Number of features in the trained model.")
    metrics: MetricsResponse | None = Field(default=None, description="Evaluation metrics of the model.")
