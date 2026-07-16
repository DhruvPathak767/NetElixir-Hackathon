import logging
import os
from pathlib import Path
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from dotenv import load_dotenv

from app.core import config
from app.core.config import settings
from app.database import engine
from app.models.base import Base
from app.models.history import ChatConversation, ChatMessage, ScenarioHistory
from app.middleware import setup_middleware

from app.api.upload import router as upload_router
from app.api.dataset import router as dataset_router
from app.api.validation import router as validation_router
from app.api.preprocessing import router as preprocessing_router
from app.api.features import router as features_router
from app.api.model_training import router as model_training_router
from app.api.forecast import router as forecast_router
from app.api.simulation import router as simulation_router
from app.api.dashboard import router as dashboard_router
from app.api.business_insights import router as business_insights_router
from app.api.scenario import router as scenario_router
from app.api.budget_optimizer import router as budget_optimizer_router
from app.api.recommendation import router as recommendation_router, router_override as recommendation_router_override
from app.api.forecast_confidence import router as forecast_confidence_router
from app.api.model_monitor import router as model_monitor_router
from app.api.system_health import router as system_health_router
from app.api.root import router as root_router

from app.api.auth import router as auth_router
from app.api.password import router as password_router
from app.api.oauth import router as oauth_router
from app.api.chat import router as chat_router
from app.api.reports import router as reports_router
from app.api.scenario_history import router as scenario_history_router

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Resolve the absolute path of the backend directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
load_dotenv(dotenv_path=BASE_DIR / ".env")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("ForecastIQ API: Startup: Checking connection and auto-creating tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logging.info("Database: Tables verified and ready.")
    except Exception as e:
        logging.critical(f"Database Initialization Error: {str(e)}")
    yield
    logging.info("ForecastIQ API: Shutdown completed.")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Production-ready FastAPI backend for Marketing Forecast system.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Apply global middlewares
setup_middleware(app)


# ---------------------------------------------------------------------------
# Exception Handlers
# ---------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logging.error("Global Validation Error: %s", str(exc))
    
    # Sanitize errors to ensure nested Exception objects are serializable
    sanitized_errors = []
    for err in exc.errors():
        sanitized_err = dict(err)
        if "ctx" in sanitized_err and isinstance(sanitized_err["ctx"], dict):
            sanitized_ctx = {}
            for k, v in sanitized_err["ctx"].items():
                if isinstance(v, Exception):
                    sanitized_ctx[k] = str(v)
                else:
                    sanitized_ctx[k] = v
            sanitized_err["ctx"] = sanitized_ctx
        # Sanitize any bytes in the error dict (like the 'input' key) to strings
        for k, v in list(sanitized_err.items()):
            if isinstance(v, bytes):
                sanitized_err[k] = v.decode('utf-8', errors='ignore')
        sanitized_errors.append(sanitized_err)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "status": "error",
            "message": "Validation error: some fields contain invalid values.",
            "errors": sanitized_errors,
            "metadata": {
                "generated_at": datetime.now().astimezone().isoformat(),
                "processing_time_ms": 0.0,
                "api_version": config.API_VERSION,
                "model_version": config.MODEL_VERSION
            }
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logging.error("Global HTTP Error: %s", exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "status": "error",
            "message": exc.detail,
            "metadata": {
                "generated_at": datetime.now().astimezone().isoformat(),
                "processing_time_ms": 0.0,
                "api_version": config.API_VERSION,
                "model_version": config.MODEL_VERSION
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    from app.logger import logger as app_logger
    app_logger.error("Global Unexpected Error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "status": "error",
            "message": f"Internal Server Error: {str(exc)}",
            "metadata": {
                "generated_at": datetime.now().astimezone().isoformat(),
                "processing_time_ms": 0.0,
                "api_version": config.API_VERSION,
                "model_version": config.MODEL_VERSION
            }
        }
    )

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(upload_router)
app.include_router(dataset_router)
app.include_router(validation_router)
app.include_router(preprocessing_router)
app.include_router(features_router)
app.include_router(model_training_router)
app.include_router(forecast_router)
app.include_router(simulation_router)
app.include_router(dashboard_router)
app.include_router(business_insights_router)
app.include_router(scenario_router)
app.include_router(budget_optimizer_router)
app.include_router(recommendation_router)
app.include_router(recommendation_router_override)
app.include_router(forecast_confidence_router)
app.include_router(model_monitor_router)
app.include_router(system_health_router)
app.include_router(root_router)
app.include_router(chat_router)
app.include_router(reports_router)
app.include_router(scenario_history_router)

# Authentication and OAuth routers (supports both direct and proxied requests)
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(oauth_router, prefix="/auth", tags=["OAuth Authentication"])
app.include_router(password_router, prefix="/auth", tags=["Password Reset"])

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(oauth_router, prefix="/api/v1/auth", tags=["OAuth Authentication"])
app.include_router(password_router, prefix="/api/v1/auth", tags=["Password Reset"])


@app.get("/", tags=["General"])
async def root():
    """
    Root endpoint that confirms the API is running.
    """
    return {
        "message": "Welcome to Marketing Forecast API",
        "version": config.API_VERSION,
        "available_apis": [
            "/health",
            "/system-health",
            "/model-monitor",
            "/upload",
            "/dataset-preview",
            "/preprocessing",
            "/features",
            "/train",
            "/forecast",
            "/simulate",
            "/optimize-budget",
            "/business-insights",
            "/ai-recommendations"
        ],
        "application_information": {
            "name": "ForecastIQ",
            "tagline": "AI-Powered Marketing Spend Optimization",
            "environment": "production",
            "backend_version": config.API_VERSION
        }
    }

@app.get("/health", tags=["Monitoring"])
async def health_check():
    """
    Health check endpoint for monitoring, load balancers, and container orchestrators.
    """
    try:
        from app.services import system_health_service
        telemetry = system_health_service.get_system_health_data()
        
        return {
            "status": telemetry.get("overall_status", "healthy").lower(),
            "uptime": telemetry.get("uptime", {}).get("uptime_seconds", 0),
            "version": config.API_VERSION,
            "timestamp": datetime.now().astimezone().isoformat(),
            "environment": "production",
            "cpu_usage": telemetry.get("system_resources", {}).get("cpu_percent", 0.0),
            "memory_usage": telemetry.get("system_resources", {}).get("memory_percent", 0.0),
            "disk_usage": telemetry.get("system_resources", {}).get("disk_percent", 0.0),
            "active_requests": 1,
            "services": telemetry.get("services", {}),
            "model_loaded": telemetry.get("model_status", {}).get("loaded", False),
            "database_connected": telemetry.get("checks", {}).get("histories_available", False),
            "is_mock": False
        }
    except Exception as exc:
        logging.getLogger(__name__).error("Failed to construct detailed health check: %s", exc)
        return {
            "status": "unhealthy",
            "uptime": 0,
            "version": config.API_VERSION,
            "timestamp": datetime.now().astimezone().isoformat(),
            "environment": "production",
            "cpu_usage": 0.0,
            "memory_usage": 0.0,
            "disk_usage": 0.0,
            "active_requests": 0,
            "services": {},
            "model_loaded": False,
            "database_connected": False,
            "is_mock": True
        }
