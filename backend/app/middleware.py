import time
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.logger import logger

def setup_middleware(app):
    """
    Sets up all application middlewares including CORS, GZip, Trusted Hosts, 
    and custom performance/request loggers.
    """
    # 1. Trusted Host Middleware
    if not settings.DEBUG:
        # Parse hostnames from ALLOWED_ORIGINS to protect from host header attacks
        hosts = set()
        for origin in settings.ALLOWED_ORIGINS:
            if "://" in origin:
                host = origin.split("://")[1].split(":")[0]
                hosts.add(host)
        hosts.update(["localhost", "127.0.0.1", "localhost:8000", "127.0.0.1:8000"])
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=list(hosts))
    else:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

    # 2. CORS Middleware
    origins = settings.ALLOWED_ORIGINS
    if isinstance(origins, str):
        origins = [origins]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 3. GZip Middleware (compress large JSON/file outputs above 1000 bytes)
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # 4. Custom Request Profiler & Logger Middleware
    @app.middleware("http")
    async def log_requests_and_process_time(request: Request, call_next):
        start_time = time.time()
        path = request.url.path
        query = request.url.query
        full_path = f"{path}?{query}" if query else path
        client_ip = request.client.host if request.client else "Unknown"

        logger.info(f"REQUEST START: {request.method} {full_path} from {client_ip}")

        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = f"{process_time:.6f}s"

            logger.info(
                f"REQUEST END:   {request.method} {path} | Status: {response.status_code} | Duration: {process_time:.4f}s"
            )
            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"REQUEST CRASH: {request.method} {path} | Error: {str(e)} | Duration: {process_time:.4f}s"
            )
            raise e
