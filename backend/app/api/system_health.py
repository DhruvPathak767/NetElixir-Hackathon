import logging
import time
from datetime import datetime
from typing import Any
from fastapi import APIRouter, HTTPException, status, Depends

from app.core import config
from app.schemas.system_health_schema import SystemHealthEnvelopeResponse
from app.services import system_health_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/system-health", tags=["System Health"])


@router.get(
    "",
    response_model=SystemHealthEnvelopeResponse,
    status_code=status.HTTP_200_OK,
    summary="Get real-time backend operational system health details",
    description="Query host machine cpu, memory, disk, process uptime, and database storage parameters.",
)
async def get_system_health(current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    logger.info("System health diagnostics requested via API.")
    try:
        paths = UserPaths(current_user.id)
        start_perf = time.perf_counter()
        data = system_health_service.get_system_health_data(paths)
        processing_time_ms = round((time.perf_counter() - start_perf) * 1000.0, 4)
        
        return {
            "success": True,
            "status": "success",
            "message": "System health diagnostics retrieved successfully.",
            "data": data,
            "metadata": {
                "generated_at": datetime.now().astimezone().isoformat(),
                "processing_time_ms": processing_time_ms,
                "api_version": config.API_VERSION,
                "model_version": config.MODEL_VERSION
            }
        }
        
    except Exception as exc:
        logger.error("Failed to fetch system health status: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"System health diagnostics failed: {str(exc)}"
        )
