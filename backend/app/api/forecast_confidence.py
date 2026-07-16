import logging
import time
from datetime import datetime
from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends

from app.core import config
from app.schemas.forecast_confidence_schema import ForecastConfidenceRequest, ForecastConfidenceEnvelopeResponse
from app.services import forecast_confidence_service
from app.services.model_monitor_service import log_prediction_latency
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/forecast-confidence", tags=["Forecast Confidence"])


@router.post(
    "",
    response_model=ForecastConfidenceEnvelopeResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict future marketing campaign revenue with confidence intervals",
    description="Loads trained model metrics and pre-computed features to predict revenue and estimate statistical uncertainty bounds.",
)
async def forecast_confidence(request: ForecastConfidenceRequest, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    logger.info("Forecast confidence assessment requested via API.")
    paths = UserPaths(current_user.id)
    
    # Empty check: check if they have uploaded a dataset first
    if not paths.has_uploaded_dataset():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a dataset to begin."
        )
        
    start_perf = time.perf_counter()
    try:
        data = forecast_confidence_service.run_forecast_confidence(request, paths)
        processing_time_ms = round((time.perf_counter() - start_perf) * 1000.0, 4)
        
        # Log latency
        log_prediction_latency(processing_time_ms, paths)
        
        # Return enveloped response
        return {
            "success": True,
            "status": "success",
            "message": "Forecast confidence generated successfully.",
            "data": data,
            "metadata": {
                "generated_at": datetime.now().astimezone().isoformat(),
                "processing_time_ms": processing_time_ms,
                "api_version": config.API_VERSION,
                "model_version": config.MODEL_VERSION
            }
        }
        
    except FileNotFoundError as exc:
        logger.error("Forecast confidence failed — model or info missing: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not trained yet. Please train the model first."
        )
        
    except ValueError as exc:
        logger.error("Forecast confidence failed — invalid input: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
        
    except Exception as exc:
        logger.error("Forecast confidence failed — execution error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast confidence prediction failure: {str(exc)}"
        )
