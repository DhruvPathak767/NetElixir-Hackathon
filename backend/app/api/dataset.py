"""
Dataset Router — app/api/dataset.py
=====================================

This router is intentionally thin — it does exactly three things:
    1. Receive the HTTP GET request
    2. Delegate all work to `dataset_preview_service`
    3. Return the validated Pydantic response

No business logic lives here. No pandas. No file I/O.

Express.js equivalent:
    // datasetRouter.js
    router.get('/preview', datasetController.preview);

    // datasetController.js
    exports.preview = async (req, res, next) => {
        try {
            const result = await datasetService.analyseLatest();
            res.json(result);
        } catch (err) {
            next(err);
        }
    };
"""

import logging

from fastapi import APIRouter, HTTPException, Depends
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

from app.schemas.dataset_schema import DatasetPreviewResponse
from app.services import dataset_preview_service

# ---------------------------------------------------------------------------
# Module logger
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
# prefix="/dataset" → all routes here are under /dataset
# tags=["Dataset"]  → grouped in Swagger UI under "Dataset"
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/dataset", tags=["Dataset"])


# ---------------------------------------------------------------------------
# GET /dataset/preview
# ---------------------------------------------------------------------------

@router.get(
    "/preview",
    response_model=DatasetPreviewResponse,
    summary="Preview the most recently uploaded dataset",
    description=(
        "Analyses the most recently uploaded CSV file and returns a full "
        "health report including: dataset overview, head/tail preview, "
        "column metadata, data quality metrics, a composite health score, "
        "and descriptive statistics — all without returning the full dataset."
    ),
)
async def get_dataset_preview(current_user: User = Depends(get_current_user)) -> DatasetPreviewResponse:
    """
    GET /dataset/preview

    Finds the newest CSV in the uploads/ folder, analyses it, and returns
    a structured health report.

    Returns
    -------
    DatasetPreviewResponse
        Validated Pydantic model containing all seven analysis sections.

    Raises
    ------
    404  No CSV files found in uploads/
    422  CSV is empty or cannot be parsed
    500  Unexpected server-side error
    """
    # ── 1. Resolve the latest uploaded file ───────────────────────────────────
    paths = UserPaths(current_user.id)
    try:
        file_path = paths.get_latest_csv_path()
    except FileNotFoundError as exc:
        logger.warning("No dataset available: %s", exc)
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    # ── 2. Run the full analysis pipeline ─────────────────────────────────────
    logger.info("Preview requested for: %s", file_path.name)
    try:
        result = dataset_preview_service.analyse_dataset(file_path)
    except ValueError as exc:
        # Logical data errors — empty CSV, parse failure, bad encoding
        logger.error("Dataset analysis failed (ValueError): %s", exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        # Unexpected I/O or pandas internals
        logger.error("Dataset analysis failed (RuntimeError): %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    logger.info("Dataset preview generated successfully for: %s", file_path.name)

    # ── 3. Return — FastAPI serialises via the response_model ─────────────────
    return result
