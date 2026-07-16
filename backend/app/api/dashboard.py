import logging
from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.dashboard_schema import DashboardResponse
from app.services import dashboard_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated campaign dashboard insights",
    description="Loads processed/features.csv and calculates overall summaries, performance listings, and splits.",
)
async def get_dashboard_summary(current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    logger.info("Dashboard summary endpoint triggered.")
    try:
        paths = UserPaths(current_user.id)
        result = dashboard_service.get_dashboard_data(paths)
        return result
        
    except FileNotFoundError as exc:
        logger.error("Dashboard calculation failed — features.csv missing: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )
        
    except Exception as exc:
        logger.error("Dashboard calculation failed — unexpected execution error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dashboard analysis failed: {str(exc)}"
        )
