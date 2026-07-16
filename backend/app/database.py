from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.logger import logger
from app.models.base import Base

DATABASE_URL = settings.DATABASE_URL

# SQLite requires disabling same-thread checks for asynchronous contexts
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    logger.info(f"Connecting to database at {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("Database connection engine initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database engine: {str(e)}")
    raise e

def get_db():
    """
    FastAPI Dependency injection provider for database sessions.
    Ensures sessions are closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
