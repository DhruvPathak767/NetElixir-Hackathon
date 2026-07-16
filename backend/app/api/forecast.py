import logging
from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.forecast_schema import ForecastRequest, ForecastResponse
from app.services import forecast_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.post(
    "",
    response_model=ForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict future marketing campaign revenue",
    description="Predicts revenue and ROAS using pre-trained LightGBM model without retraining.",
)
async def forecast_revenue(request: ForecastRequest, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    logger.info("Forecast requested")
    paths = UserPaths(current_user.id)
    
    # Empty check: check if they have uploaded a dataset first
    if not paths.has_uploaded_dataset():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a dataset to begin."
        )
        
    try:
        result = forecast_service.predict_revenue(request, paths)
        logger.info("Prediction completed")
        return result
        
    except FileNotFoundError as exc:
        logger.error("Forecast failed — model or info missing: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not trained yet. Please train the model first."
        )
        
    except ValueError as exc:
        logger.error("Forecast failed — invalid input fields: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
        
    except Exception as exc:
        logger.error("Forecast failed — prediction runner failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failure: {str(exc)}"
        )
