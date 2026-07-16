import os
import sys
import logging
from logging.handlers import RotatingFileHandler
from app.core.config import settings

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}

log_level = LOG_LEVELS.get(settings.LOG_LEVEL.upper(), logging.INFO)

# Setup root logger for the application
logger = logging.getLogger("forecastiq")
logger.setLevel(log_level)

# Clear existing handlers to prevent duplicate logs
if logger.hasHandlers():
    logger.handlers.clear()

# Format structure
log_format = logging.Formatter(
    fmt="%(asctime)s | %(levelname)-8s | %(filename)s:%(lineno)d | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Console Output Handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(log_level)
console_handler.setFormatter(log_format)
logger.addHandler(console_handler)

# File Output Handler (Rotates at 5MB, keeps up to 5 logs)
file_handler = RotatingFileHandler(
    filename=os.path.join("logs", "app.log"),
    maxBytes=5 * 1024 * 1024,
    backupCount=5,
    encoding="utf-8"
)
file_handler.setLevel(log_level)
file_handler.setFormatter(log_format)
logger.addHandler(file_handler)

# Prevent logs from bubbling up to general root logger
logger.propagate = False
