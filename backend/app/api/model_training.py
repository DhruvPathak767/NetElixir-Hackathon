import logging
from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.model_training_schema import (
    FeatureImportanceResponse,
    ModelStatusResponse,
    ModelTrainingResponse,
)
from app.services import model_training_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Model Training"])


@router.post(
    "/train-model",
    response_model=ModelTrainingResponse,
    status_code=status.HTTP_200_OK,
    summary="Train LightGBM Revenue Forecast Model",
    description="Loads processed/features.csv, runs 5-fold cross validation, executes RandomizedSearchCV hyperparameter tuning, trains the final estimator, and saves outputs.",
)
async def train_revenue_model(current_user: User = Depends(get_current_user)):
    logger.info("Model training endpoint triggered.")
    try:
        paths = UserPaths(current_user.id)
        result = model_training_service.train_model(paths)
        return result
    except FileNotFoundError as exc:
        logger.error("Model training failed (File Not Found): %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )
    except ValueError as exc:
        logger.error("Model training failed (Value Error): %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
    except Exception as exc:
        logger.error("Unexpected error during model training: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training failed: {str(exc)}"
        )


@router.get(
    "/model/feature-importance",
    response_model=FeatureImportanceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Feature Importances",
    description="Reads sorted feature importances directly from models/feature_importance.csv without retraining the model.",
)
async def get_feature_importance(current_user: User = Depends(get_current_user)):
    logger.info("Feature importance retrieval endpoint triggered.")
    try:
        paths = UserPaths(current_user.id)
        top_features = model_training_service.get_feature_importances(paths)
        return {"success": True, "top_features": top_features}
    except FileNotFoundError as exc:
        logger.error("Feature importance retrieval failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained model feature importance file found. Please train the model first."
        )
    except Exception as exc:
        logger.error("Unexpected error during feature importance retrieval: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feature importance retrieval failed: {str(exc)}"
        )


@router.get(
    "/model/info",
    response_model=dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Get Model Info Metadata",
    description="Loads and returns the comprehensive model training and metadata dictionary from models/model_info.json.",
)
async def get_model_info(current_user: User = Depends(get_current_user)):
    logger.info("Model info endpoint triggered.")
    try:
        paths = UserPaths(current_user.id)
        info = model_training_service.get_model_info(paths)
        return info
    except FileNotFoundError as exc:
        logger.error("Model info retrieval failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No model metadata info file found. Please train the model first."
        )
    except Exception as exc:
        logger.error("Unexpected error during model info retrieval: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model info retrieval failed: {str(exc)}"
        )


@router.get(
    "/model/status",
    response_model=ModelStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Model Status",
    description="Checks model file existence and returns current model training timestamp, feature count, and evaluation metrics.",
)
async def get_model_status(current_user: User = Depends(get_current_user)):
    logger.info("Model status endpoint triggered.")
    try:
        paths = UserPaths(current_user.id)
        status_data = model_training_service.get_model_status(paths)
        return status_data
    except Exception as exc:
        logger.error("Unexpected error during model status retrieval: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model status retrieval failed: {str(exc)}"
        )
