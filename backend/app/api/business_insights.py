import logging
from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.business_insights_schema import BusinessInsightsResponse
from app.services import business_insights_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/business-insights", tags=["Business Insights"])


@router.get(
    "",
    response_model=BusinessInsightsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get business performance insights and recommendations",
    description="Loads processed/features.csv, performs multi-dimension aggregation analyses, and returns formatted recommendations.",
)
async def get_insights(current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    logger.info("Business insights endpoint triggered.")
    try:
        paths = UserPaths(current_user.id)
        result = business_insights_service.get_business_insights(paths)
        return result
        
    except FileNotFoundError as exc:
        logger.error("Insights calculation failed — features.csv missing: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )
        
    except Exception as exc:
        logger.error("Insights calculation failed — execution error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Insights generation failed: {str(exc)}"
        )
