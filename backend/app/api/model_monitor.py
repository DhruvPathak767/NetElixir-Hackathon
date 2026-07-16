import logging
import time
from datetime import datetime
from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends

from app.core import config
from app.schemas.model_monitor_schema import ModelMonitorEnvelopeResponse, ModelNotTrainedResponse
from app.services import model_monitor_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/model-monitor", tags=["Model Monitor"])


@router.get(
    "",
    response_model=ModelMonitorEnvelopeResponse | ModelNotTrainedResponse,
    status_code=status.HTTP_200_OK,
    summary="Get pre-trained ML model diagnostic monitoring statistics",
    description="Loads saved metrics and dataset dimensions to verify the active model health status.",
)
async def get_model_monitoring(current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    logger.info("Model monitoring diagnostics requested via API.")
    paths = UserPaths(current_user.id)
    
    # Graceful check for missing model
    if not model_monitor_service.check_model_trained(paths):
        logger.warning("Diagnostics requested but model is not trained.")
        return {
            "success": False,
            "message": "Model not trained."
        }
        
    try:
        start_perf = time.perf_counter()
        data = model_monitor_service.get_model_monitor_data(paths)
        processing_time_ms = round((time.perf_counter() - start_perf) * 1000.0, 4)
        
        return {
            "success": True,
            "status": "success",
            "message": "Model monitoring diagnostics retrieved successfully.",
            "data": data,
            "metadata": {
                "generated_at": datetime.now().astimezone().isoformat(),
                "processing_time_ms": processing_time_ms,
                "api_version": config.API_VERSION,
                "model_version": config.MODEL_VERSION
            }
        }
        
    except Exception as exc:
        logger.error("Model monitoring diagnostics failed — unexpected error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagnostics failed: {str(exc)}"
        )
