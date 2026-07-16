import logging
from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.simulation_schema import SimulationRequest, SimulationResponse
from app.services import simulation_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/simulate", tags=["Budget Simulation"])


@router.post(
    "",
    response_model=SimulationResponse,
    status_code=status.HTTP_200_OK,
    summary="Simulate future campaign spends",
    description="Predicts revenue, ROAS, and estimated profit under different budget scenarios using pre-trained LightGBM model.",
)
async def simulate_scenario(request: SimulationRequest, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    logger.info("Simulation Started")
    paths = UserPaths(current_user.id)
    
    # Empty check: check if they have uploaded a dataset first
    if not paths.has_uploaded_dataset():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a dataset to begin."
        )
        
    try:
        result = simulation_service.simulate_budget(request, paths)
        
        logger.info("Prediction Completed")
        logger.info("Prediction Time: %.2f ms", result["prediction_time_ms"])
        
        return result

    except FileNotFoundError as exc:
        logger.error("Simulation failed — model not trained: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not trained yet. Please train the model first."
        )

    except ValueError as exc:
        logger.error("Simulation failed — validation error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )

    except Exception as exc:
        logger.error("Simulation failed — execution error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failure: {str(exc)}"
        )
