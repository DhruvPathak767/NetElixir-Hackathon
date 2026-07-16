"""
CSV Upload Router — app/api/upload.py
======================================

Concepts Explained
------------------

1. **APIRouter**
   FastAPI's modular routing system. Instead of defining all routes on the
   main `app` instance, each feature registers its routes on a dedicated
   `APIRouter` and the router is included into `app` inside `main.py`.
   Express equivalent: `express.Router()`.

   Usage:
       router = APIRouter()            # create
       @router.post("/upload")         # attach routes
       app.include_router(router, ...)  # register in main.py

2. **UploadFile**
   FastAPI's high-level file abstraction. Wraps the raw `SpooledTemporaryFile`
   (Python standard library) and exposes async streaming helpers:
       - `.filename`      → original filename sent by the client
       - `.content_type`  → MIME type (e.g. "text/csv")
       - `.size`          → file size in bytes (available after v0.103)
       - `.read(size)`    → async read N bytes (or all if no arg)
       - `.seek(0)`       → rewind to beginning
       - `.close()`       → release the temp file

3. **File()**
   `File()` is used in a function signature to tell FastAPI that this
   parameter comes from a `multipart/form-data` body (not JSON).
   It works as a metadata/validation descriptor — similar to `Query()` or
   `Body()` in FastAPI.

   Without `File()`, FastAPI would not know how to parse the upload:
       async def upload(file: UploadFile = File(...))
                                          ^^^^^^^^^^
                  marks 'file' as required multipart form field

4. **Why UploadFile over plain `bytes`?**
   ┌─────────────────────┬──────────────────────────────────────────────────┐
   │ Feature             │ UploadFile               │ bytes                 │
   ├─────────────────────┼──────────────────────────┼───────────────────────┤
   │ Memory usage        │ Streams to disk for large │ Entire file loaded    │
   │                     │ files (SpooledTempFile)   │ into RAM at once      │
   │ Async I/O           │ Yes — await file.read()   │ No — synchronous      │
   │ Metadata access     │ filename, content_type    │ None                  │
   │ Large file support  │ Yes (no OOM risk)         │ Risk for large files  │
   │ Chunked reading     │ Yes — read(chunk_size)    │ No                    │
   └─────────────────────┴──────────────────────────┴───────────────────────┘

5. **UploadFile vs Multer (Express.js)**
   ┌─────────────────────┬──────────────────────────┬───────────────────────┐
   │ Aspect              │ FastAPI UploadFile        │ Multer (Express)      │
   ├─────────────────────┼──────────────────────────┼───────────────────────┤
   │ Integration         │ Built-in, zero config     │ Third-party package   │
   │ File limit config   │ Via File() descriptor or  │ multer({ limits: {}}) │
   │                     │ middleware                │                       │
   │ Storage engine      │ SpooledTemporaryFile       │ DiskStorage /         │
   │                     │ (auto spills to disk)     │ MemoryStorage         │
   │ Filter / validation │ Manual in route handler   │ fileFilter callback   │
   │ Field name access   │ file.filename             │ req.file.originalname │
   │ MIME type access    │ file.content_type         │ req.file.mimetype     │
   │ Async streaming     │ Native (await read())     │ Streams via callback  │
   │ Swagger docs        │ Auto-generated            │ Manual (no built-in)  │
   └─────────────────────┴──────────────────────────┴───────────────────────┘
"""

import shutil
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, Depends
from fastapi.responses import JSONResponse

from app.services.csv_service import analyse_csv
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
# prefix="/upload" means all routes here are under /upload.
# tags=["Upload"] groups them under "Upload" in Swagger UI.
# Express equivalent: const uploadRouter = express.Router()
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/upload", tags=["Upload"])

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
# Resolve the uploads/ folder relative to the backend root (two levels up
# from this file: api/ → app/ → backend/).
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR: Path = BACKEND_DIR / "uploads"

ALLOWED_EXTENSIONS = {".csv", ".xlsx"}
ALLOWED_CONTENT_TYPES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ensure_upload_dir() -> None:
    """
    Create the uploads/ directory if it does not already exist.
    Equivalent to Node's `fs.mkdirSync(dir, { recursive: true })`.
    """
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _generate_unique_filename(original_filename: str) -> str:
    """
    Produce a collision-resistant filename by prepending an ISO timestamp.
    Example: 'sales_data.csv' → '20260714_212825_sales_data.csv'
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    stem = Path(original_filename).stem
    return f"{timestamp}_{stem}.csv"


def _validate_csv_file(file: UploadFile) -> None:
    """
    Validate that the uploaded file is a non-empty CSV or Excel workbook.
    Raises HTTPException on any violation.
    """
    # Guard: file must be present and have a name
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    # Guard: extension must be .csv or .xlsx
    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Invalid file type '{extension}'. "
                "Only CSV files (.csv) and Excel sheets (.xlsx) are accepted."
            ),
        )

    # Guard: MIME type must be compatible
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Invalid MIME type '{file.content_type}'. "
                "Expected a CSV or Excel content type."
            ),
        )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/",
    summary="Upload a CSV file",
    description=(
        "Accepts a single CSV file via `multipart/form-data`, "
        "saves it to the `uploads/` folder with a unique timestamped name, "
        "and returns metadata about the saved file."
    ),
    status_code=201,
)
async def upload_csv(
    file: UploadFile = File(
        ...,
        description="CSV file to upload (multipart/form-data).",
    ),
    current_user: User = Depends(get_current_user)
):
    """
    POST /upload

    Validates, saves, and returns metadata for an uploaded CSV file.

    - **file**: Required. Must be a `.csv` file sent as multipart/form-data.

    Returns a JSON object with `success`, `filename`, `original_filename`,
    `file_size`, `uploaded_at`, and `message`.
    """
    # ── 1. Validate ──────────────────────────────────────────────────────────
    _validate_csv_file(file)

    # ── 2. Read content into memory for size check ────────────────────────────
    # We read once to check if the file is empty, then save with shutil.
    # For very large files a chunked approach is preferable, but for CSV
    # uploads this is safe and clear.
    try:
        contents = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read the uploaded file: {exc}",
        ) from exc

    # Guard: file must not be empty
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    file_size_bytes = len(contents)

    # ── 3. Prepare destination ────────────────────────────────────────────────
    paths = UserPaths(current_user.id)
    unique_filename = _generate_unique_filename(file.filename)
    destination_path = paths.uploads_dir / unique_filename

    # ── 4. Save to disk ───────────────────────────────────────────────────────
    try:
        # Rewind the file pointer before saving — read() moves it to EOF.
        await file.seek(0)
        extension = Path(file.filename).suffix.lower()
        if extension == ".xlsx":
            # Convert Excel worksheet to standard CSV format
            df = pd.read_excel(file.file)
            df.to_csv(destination_path, index=False)
        else:
            # Save standard CSV stream
            with destination_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save the file to disk: {exc}",
        ) from exc
    finally:
        await file.close()

    # ── 5. Analyse the saved CSV via the service layer ───────────────────────
    # The route only knows *that* analysis should happen.
    # The service knows *how* to do it — clean separation of concerns.
    try:
        dataset: dict[str, Any] = analyse_csv(destination_path)
    except ValueError as exc:
        # Readable data error (empty file, parse error, encoding issue)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        # Unexpected I/O or pandas failure
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # ── 6. Build and return response ──────────────────────────────────────────
    uploaded_at = datetime.now(timezone.utc).isoformat()

    return JSONResponse(
        status_code=201,
        content={
            "success": True,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_size": f"{file_size_bytes} bytes",
            "uploaded_at": uploaded_at,
            "message": "File uploaded successfully",
            "dataset": dataset,
        },
    )
