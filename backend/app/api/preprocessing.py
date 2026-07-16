"""
Preprocessing Router — app/api/preprocessing.py
=================================================

Intentionally thin. This router does exactly three things:
  1. Receive the POST /preprocess request
  2. Call preprocessing_service.preprocess()
  3. Return the JSON result

Zero business logic lives here. No pandas. No file I/O.

Express.js equivalent:
    router.post('/preprocess', async (req, res, next) => {
        try {
            const result = await preprocessingService.run();
            res.json(result);
        } catch (err) {
            next(err);
        }
    });
"""

import logging

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.services import preprocessing_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/preprocess", tags=["Preprocessing"])


# ---------------------------------------------------------------------------
# POST /preprocess
# ---------------------------------------------------------------------------

@router.post(
    "",
    summary="Run the full preprocessing pipeline",
    description=(
        "Loads the most recently uploaded CSV, applies a 9-step cleaning "
        "pipeline (strip whitespace, type conversion, missing-value imputation, "
        "deduplication, text standardisation), and saves the result to "
        "`processed/cleaned_data.csv`."
    ),
    status_code=200,
)
async def run_preprocessing(current_user: User = Depends(get_current_user)) -> JSONResponse:
    """
    POST /preprocess

    Triggers the full data cleaning pipeline on the latest uploaded CSV.

    Returns
    -------
    200  Success JSON:
        {
            "success": true,
            "rows": 2000,
            "columns": 10,
            "duplicates_removed": 18,
            "missing_values_fixed": 94,
            "saved_to": "processed/cleaned_data.csv"
        }

    Raises
    ------
    404  No CSV found in the uploads directory.
    400  CSV cannot be read (empty, corrupted, bad encoding).
    500  Unexpected server error during preprocessing.
    """
    # ── 1. Delegate entirely to the service ───────────────────────────────────
    logger.info("Preprocessing pipeline triggered via POST /preprocess")
    try:
        paths = UserPaths(current_user.id)
        result = preprocessing_service.preprocess(paths)

    except FileNotFoundError as exc:
        logger.warning("Preprocessing failed — no dataset found: %s", exc)
        raise HTTPException(
            status_code=404,
            detail="No dataset uploaded. Please upload a CSV file first.",
        ) from exc

    except ValueError as exc:
        logger.error("Preprocessing failed — data error: %s", exc)
        raise HTTPException(
            status_code=400,
            detail=f"Could not read the CSV file: {exc}",
        ) from exc

    except RuntimeError as exc:
        logger.error("Preprocessing failed — runtime error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # ── 2. Return — FastAPI serialises the dict automatically ─────────────────
    logger.info(
        "Preprocessing complete — rows_after: %d, dupes removed: %d, missing fixed: %d",
        result["rows_after"],
        result["duplicates_removed"],
        result["missing_values_fixed"],
    )
    return JSONResponse(status_code=200, content=result)
