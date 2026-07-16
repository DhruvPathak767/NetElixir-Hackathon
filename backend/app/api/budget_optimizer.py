import logging
from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.budget_optimizer_schema import BudgetOptimizationRequest, BudgetOptimizationResponse
from app.services import budget_optimizer_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Budget Optimizer"])


@router.post(
    "/optimize-budget",
    response_model=BudgetOptimizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Optimize marketing budget splits",
    description="Loads pre-trained model and evaluates candidate allocations to find the revenue-maximizing split.",
)
async def optimize_budget_allocations(payload: BudgetOptimizationRequest, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    logger.info("Budget Optimization requested")
    paths = UserPaths(current_user.id)
    
    # Empty check: check if they have uploaded a dataset first
    if not paths.has_uploaded_dataset():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a dataset to begin."
        )
        
    try:
        result = budget_optimizer_service.optimize_budget(payload, paths)
        return result
        
    except ValueError as exc:
        logger.error("Budget Optimization validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
        
    except FileNotFoundError as exc:
        logger.error("Budget Optimization failed — model not found: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not trained yet. Please train the model first."
        )
        
    except Exception as exc:
        logger.error("Budget Optimization encountered internal error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Budget optimization failed: {str(exc)}"
        )
