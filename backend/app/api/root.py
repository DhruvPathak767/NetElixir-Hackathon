"""
Root Router — app/api/root.py
=============================

Exposes the GET /api endpoint returning project information, version details,
available APIs, active model version, and global model training status.
"""

import logging
import time
from datetime import datetime
from typing import Any
from fastapi import APIRouter, status

from app.core import config
from app.schemas.root_schema import RootEnvelopeResponse
from app.services import model_monitor_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["API Root"])


@router.get(
    "",
    response_model=RootEnvelopeResponse,
    status_code=status.HTTP_200_OK,
    summary="Get API platform meta-information and status details",
    description="Returns project name, description, active versions, endpoints list, and system status.",
)
async def get_root_info() -> dict[str, Any]:
    logger.info("API Root information requested.")
    start_perf = time.perf_counter()
    
    # Check model loading to determine system status
    model_trained = model_monitor_service.check_model_trained()
    system_status = "Healthy" if model_trained else "Degraded (Model not trained)"
    
    available_apis = [
        "GET /api",
        "POST /forecast",
        "POST /forecast-confidence",
        "GET /model-monitor",
        "GET /system-health",
        "GET /ai-recommendations",
        "GET /ai-recommendations/history",
        "GET /ai/recommendations",
        "GET /ai/recommendations/history",
        "POST /simulate",
        "POST /compare-scenarios",
        "POST /optimize-budget",
        "POST /train-model"
    ]
    
    data = {
        "project_name": "AI Marketing Forecasting Platform",
        "description": "Production-grade decision support and predictive analytics system for marketing campaign budget optimization.",
        "api_version": config.API_VERSION,
        "model_version": config.MODEL_VERSION,
        "system_status": system_status,
        "available_apis": available_apis
    }
    
    processing_time_ms = round((time.perf_counter() - start_perf) * 1000.0, 4)
    
    return {
        "success": True,
        "status": "success",
        "message": "API status diagnostics retrieved successfully.",
        "data": data,
        "metadata": {
            "generated_at": datetime.now().astimezone().isoformat(),
            "processing_time_ms": processing_time_ms,
            "api_version": config.API_VERSION,
            "model_version": config.MODEL_VERSION
        }
    }
