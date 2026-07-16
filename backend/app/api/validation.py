"""
Validation Router — app/api/validation.py
==========================================

Intentionally thin: receive HTTP request → call service → return response.
All business logic lives in validation_service.py.

Express.js equivalent:
    router.get('/validation/report', validationController.report);
    // controller calls validationService.generateReport(latestFile)
"""

import logging

from fastapi import APIRouter, HTTPException, Depends
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

from app.schemas.validation_schema import ValidationReportResponse
from app.services import validation_service

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
# prefix="/validation" → every route here lives under /validation
# tags=["Validation"]  → Swagger UI groups them under "Validation"
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/validation", tags=["Validation"])


# ---------------------------------------------------------------------------
# GET /validation/report
# ---------------------------------------------------------------------------

@router.get(
    "/report",
    response_model=ValidationReportResponse,
    summary="Validate the most recently uploaded dataset",
    description=(
        "Runs a full 7-rule validation pipeline on the latest uploaded CSV: "
        "missing values, duplicates, negative financial values, invalid dates, "
        "invalid numeric formats, empty columns, and required-column presence. "
        "Returns a scored report with actionable recommendations."
    ),
)
async def get_validation_report(current_user: User = Depends(get_current_user)) -> ValidationReportResponse:
    """
    GET /validation/report

    Resolves the newest CSV in uploads/, runs all validation rules, computes
    a composite score, and returns a structured validation report.

    Returns
    -------
    ValidationReportResponse
        Typed Pydantic model with all seven validation sections.

    Raises
    ------
    404  No CSV file found in the uploads directory.
    400  CSV file cannot be read (empty, corrupted, bad encoding).
    500  Unexpected server error during validation.
    """
    # ── 1. Resolve the latest uploaded file (reuse existing helper) ───────────
    paths = UserPaths(current_user.id)
    try:
        file_path = paths.get_latest_csv_path()
    except FileNotFoundError as exc:
        logger.warning("Validation requested but no dataset found: %s", exc)
        raise HTTPException(status_code=404, detail="No dataset uploaded.") from exc

    # ── 2. Run the full validation pipeline ───────────────────────────────────
    logger.info("Validation report requested for: %s", file_path.name)
    try:
        result = validation_service.generate_validation_report(file_path)
    except ValueError as exc:
        # Logical data error — empty CSV, parse failure, bad encoding.
        logger.error("Validation failed (data error): %s", exc)
        raise HTTPException(
            status_code=400,
            detail=f"CSV could not be read: {exc}",
        ) from exc
    except RuntimeError as exc:
        # Unexpected system-level failure.
        logger.error("Validation failed (runtime error): %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    logger.info(
        "Validation report delivered — score: %d (%s)",
        result.summary.validation_score,
        result.summary.status,
    )
    return result
