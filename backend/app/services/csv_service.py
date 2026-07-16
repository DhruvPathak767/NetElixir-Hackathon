"""
CSV Service — app/services/csv_service.py
==========================================

Concepts Explained
------------------

1. **What is a Pandas DataFrame?**
   A DataFrame is a 2-dimensional, labelled data structure — essentially an
   in-memory table with named columns and an integer index.
   Every column can hold a different data type (int, float, string, datetime).

   Think of it like this for someone coming from Node.js/SQL:

   SQL Table (PostgreSQL / MySQL)        Pandas DataFrame
   ─────────────────────────────         ────────────────────────────
   Lives on a database server            Lives in Python process RAM
   Queried with SQL strings              Operated on with Python/pandas API
   Rows = table records                  Rows = DataFrame rows (index)
   Columns = table columns               Columns = Series objects
   SELECT name FROM users                df["name"]
   WHERE age > 30                        df[df["age"] > 30]
   GROUP BY dept                         df.groupby("dept")
   JOIN users ON ...                     pd.merge(df1, df2, on="id")
   COUNT(*)                              len(df) or df.shape[0]
   Persisted on disk                     Transient — lost when script ends

   Key insight: pandas lets you do SQL-style analytics entirely in Python
   without a database, which makes it ideal for data preprocessing pipelines.

2. **Why use a service layer?**
   A service layer isolates business logic from transport logic (HTTP).
   The router only knows how to receive an HTTP request and return a response.
   The service only knows how to analyse a CSV — it has no knowledge of HTTP,
   FastAPI, or how the file arrived.

   Benefits:
   - Testable in isolation (no HTTP client needed to unit-test the service)
   - Reusable across multiple routers or CLI scripts
   - Follows Single Responsibility Principle
   - Easier to swap implementations (e.g. replace pandas with polars later)

3. **Why not write pandas code directly inside the route?**
   Writing data logic inside a route handler couples two unrelated concerns:
   HTTP transport and data processing. This leads to:
   - Fat route handlers that are hard to read and test
   - Logic duplication when another endpoint needs the same analysis
   - No separation between "how did the file arrive" and "what do we do with it"

   Express equivalent analogy:
   - BAD:  app.post('/upload', async (req, res) => { /* 80 lines of data logic */ })
   - GOOD: app.post('/upload', uploadMiddleware, csvController)
           // csvController calls csvService.analyse(filePath)
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyse_csv(file_path: Path) -> dict[str, Any]:
    """
    Read a CSV file from disk and extract structural metadata.

    Parameters
    ----------
    file_path : Path
        Absolute path to the saved CSV file.

    Returns
    -------
    dict
        A dictionary with keys: rows, columns, column_names, data_types,
        memory_usage, head, tail.

    Raises
    ------
    ValueError
        When the CSV is empty, malformed, or cannot be decoded.
    RuntimeError
        For unexpected I/O or pandas errors.
    """
    df = _load_dataframe(file_path)
    return _extract_metadata(df)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _load_dataframe(file_path: Path) -> pd.DataFrame:
    """
    Attempt to read the CSV into a DataFrame, trying common encodings.

    We try UTF-8 first (the standard), then latin-1 (covers most legacy
    Western European CSVs that have accented characters). This mirrors what
    tools like Excel do silently.

    Raises
    ------
    ValueError
        Empty file, completely unparseable content, or no supported encoding.
    RuntimeError
        Unexpected OS-level or pandas error.
    """
    encodings = ["utf-8", "latin-1", "cp1252"]
    last_error: Exception | None = None

    for encoding in encodings:
        try:
            df = pd.read_csv(
                file_path,
                encoding=encoding,
                # Keep raw strings instead of silently converting mixed types.
                # This makes column dtype inspection meaningful.
                low_memory=False,
            )

            if df.empty:
                raise ValueError(
                    "The CSV file was parsed successfully but contains no data rows."
                )

            return df

        except ValueError:
            # Re-raise our own "empty" error immediately — no point trying
            # another encoding.
            raise

        except UnicodeDecodeError:
            # Current encoding failed; try the next one.
            last_error = UnicodeDecodeError.__new__(UnicodeDecodeError)
            continue

        except pd.errors.EmptyDataError:
            raise ValueError("The CSV file is empty (no columns were found).")

        except pd.errors.ParserError as exc:
            raise ValueError(f"The CSV file could not be parsed: {exc}") from exc

        except FileNotFoundError:
            raise ValueError(f"File not found at path: {file_path}")

        except Exception as exc:
            raise RuntimeError(
                f"An unexpected error occurred while reading the CSV: {exc}"
            ) from exc

    # All encodings exhausted.
    raise ValueError(
        f"Unable to decode '{file_path.name}' with any supported encoding "
        f"({', '.join(encodings)}). The file may be binary or use an unsupported charset."
    )


def _extract_metadata(df: pd.DataFrame) -> dict[str, Any]:
    """
    Derive structural statistics from a loaded DataFrame.

    All values are serialised to JSON-safe Python types (no numpy scalars,
    no pandas Index objects) so FastAPI's JSONResponse can serialise them
    without a custom encoder.
    """
    # ── Shape ─────────────────────────────────────────────────────────────────
    num_rows, num_cols = df.shape                   # e.g. (2001, 30)

    # ── Column names ──────────────────────────────────────────────────────────
    column_names: list[str] = df.columns.tolist()   # Index → plain list

    # ── Data types ────────────────────────────────────────────────────────────
    # dtype.name gives clean strings: "int64", "float64", "object", etc.
    # "object" in pandas almost always means a mixed or string column.
    data_types: dict[str, str] = {
        col: str(df[col].dtype) for col in df.columns
    }

    # ── Memory usage ──────────────────────────────────────────────────────────
    # deep=True accounts for the actual size of string objects in "object" columns.
    total_bytes: int = int(df.memory_usage(deep=True).sum())
    memory_usage: str = _format_bytes(total_bytes)

    # ── Head & tail ───────────────────────────────────────────────────────────
    # Convert to records → list of dicts → JSON-safe.
    # replace NaN/NaT/inf with None so they serialise as JSON null.
    head: list[dict[str, Any]] = _dataframe_to_records(df.head(5))
    tail: list[dict[str, Any]] = _dataframe_to_records(df.tail(5))

    return {
        "rows": num_rows,
        "columns": num_cols,
        "column_names": column_names,
        "data_types": data_types,
        "memory_usage": memory_usage,
        "head": head,
        "tail": tail,
    }


def _dataframe_to_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    """
    Convert a DataFrame slice to a list of plain Python dicts.

    pandas uses numpy scalars internally (np.int64, np.float64, np.nan).
    JSONResponse cannot serialise these directly, so we convert each value:
    - NaN / NaT  → None  (becomes JSON null)
    - numpy int  → int
    - numpy float → float
    - everything else → str as fallback
    """
    records = df.where(pd.notnull(df), other=None).to_dict(orient="records")

    sanitised: list[dict[str, Any]] = []
    for row in records:
        sanitised.append({
            key: _sanitise_value(val) for key, val in row.items()
        })
    return sanitised


def _sanitise_value(value: Any) -> Any:
    """Coerce a single cell value to a JSON-serialisable Python type."""
    if value is None:
        return None
    # Check for pandas / numpy NA values
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        # pd.isna raises TypeError for some types (e.g. lists); safe to ignore
        pass

    # numpy integer scalars → Python int
    if hasattr(value, "item"):
        return value.item()

    return value


def _format_bytes(num_bytes: int) -> str:
    """
    Return a human-readable string for a byte count.
    e.g. 495897 → "484.3 KB"
    """
    for unit in ("B", "KB", "MB", "GB"):
        if num_bytes < 1024:
            return f"{num_bytes:.1f} {unit}"
        num_bytes /= 1024
    return f"{num_bytes:.1f} TB"
