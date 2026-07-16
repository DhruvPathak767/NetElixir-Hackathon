import logging
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.features_schema import FeaturesResponse
from app.services import feature_engineering_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/features", tags=["Features"])


@router.post(
    "",
    response_model=FeaturesResponse,
    status_code=status.HTTP_200_OK,
    summary="Construct engineered features",
    description="Loads processed/cleaned_data.csv, constructs time, spend, KPI, and historical features, encodes categorical variables, and saves the output.",
)
async def create_features(current_user: User = Depends(get_current_user)):
    logger.info("Features generation endpoint triggered.")
    try:
        paths = UserPaths(current_user.id)
        result = feature_engineering_service.generate_features(paths)
        return result
    except FileNotFoundError as exc:
        logger.error("Features generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )
    except Exception as exc:
        logger.error("Unexpected error during features generation: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feature engineering failed: {str(exc)}"
        )
