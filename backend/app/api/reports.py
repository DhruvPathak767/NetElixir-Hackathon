"""
reports.py — Report API Router
================================
Provides authenticated endpoints for generating, listing, downloading, and deleting
performance reports based on the authenticated user's real pipeline data.
"""
import logging
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths
from app.services import reports_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports"])


class GenerateReportRequest(BaseModel):
    report_type: str = "txt"  # "txt", "xlsx", "csv"
    scenario_name: Optional[str] = "Baseline Forecast Scenario"


@router.post(
    "/generate",
    status_code=status.HTTP_200_OK,
    summary="Generate a performance report",
    description="Aggregates real user pipeline data (dashboard, model, recommendations) to generate a downloadable report file."
)
async def generate_report(
    payload: GenerateReportRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        paths = UserPaths(current_user.id)
        meta = reports_service.generate_report(
            user_id=current_user.id,
            report_type=payload.report_type,
            scenario_name=payload.scenario_name,
            paths=paths
        )
        return {"success": True, "message": "Report generated successfully", "data": meta}
    except Exception as exc:
        logger.error("Generate report error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(exc)}"
        )


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Get report history",
    description="Returns the authenticated user's report history with search, type filter, and pagination."
)
async def get_reports(
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user)
):
    try:
        result = reports_service.get_reports_list(
            user_id=current_user.id,
            search=search,
            report_type=type,
            page=page,
            limit=limit
        )
        return {"success": True, "data": result}
    except Exception as exc:
        logger.error("Get reports error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get(
    "/download/{report_id}",
    summary="Download report file",
    description="Streams the report file to the client for the authenticated user."
)
async def download_report(
    report_id: str,
    current_user: User = Depends(get_current_user)
):
    filepath = reports_service.get_report_filepath(current_user.id, report_id)
    if not filepath or not filepath.exists():
        raise HTTPException(status_code=404, detail="Report file not found or access denied.")

    filename = filepath.name
    ext = filename.rsplit(".", 1)[-1].lower()
    media_types = {
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv": "text/csv",
        "txt": "text/plain",
        "pdf": "application/pdf"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    return FileResponse(path=str(filepath), filename=filename, media_type=media_type)


@router.delete(
    "/{report_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a report"
)
async def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_user)
):
    success = reports_service.delete_report(current_user.id, report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found or access denied.")
    return {"success": True, "message": "Report deleted successfully"}
