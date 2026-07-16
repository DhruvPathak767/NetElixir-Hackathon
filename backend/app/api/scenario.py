import logging
from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.scenario_schema import ScenarioComparisonRequest, ScenarioComparisonResponse
from app.services import scenario_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scenario", tags=["Scenario Comparison"])


@router.post(
    "/compare",
    response_model=ScenarioComparisonResponse,
    status_code=status.HTTP_200_OK,
    summary="Compare two budget scenarios",
    description="Loads the pre-trained LightGBM model, runs forecasts for Scenario A and Scenario B, and ranks them.",
)
async def compare_budget_scenarios(payload: ScenarioComparisonRequest, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    logger.info("Scenario Comparison requested")
    paths = UserPaths(current_user.id)
    
    # Empty check: check if they have uploaded a dataset first
    if not paths.has_uploaded_dataset():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a dataset to begin."
        )
        
    try:
        result = scenario_service.compare_scenarios(payload, paths)
        return result
        
    except ValueError as exc:
        logger.error("Scenario Comparison validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
        
    except FileNotFoundError as exc:
        logger.error("Scenario Comparison failed — model not found: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not trained yet. Please train the model first."
        )
        
    except Exception as exc:
        logger.error("Scenario Comparison encountered internal error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison failed: {str(exc)}"
        )
