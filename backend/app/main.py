"""
CropIQ FastAPI Main Application
Integrates middleware, lifecycle management, error handlers, and API routes.
"""

from contextlib import asynccontextmanager
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.routes import (
    health,
    model,
    prediction,
    explainability,
    risk,
    recommendations,
    scenarios,
)
from .core.config import get_settings
from .core.exceptions import (
    CropIQException,
    cropiq_exception_handler,
    generic_exception_handler,
    validation_exception_handler,
)
from .core.logging import get_logger, setup_logging
from .services.model_service import ModelService

setup_logging()
logger = get_logger("cropiq.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle manager."""
    settings = get_settings()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.ENVIRONMENT}] ...")

    # 1. Singleton Model Loading on Startup (Rule 9, 58)
    model_service = ModelService.get_instance()
    try:
        model_service.load(settings.MODEL_PATH, settings.MODEL_METADATA_PATH)
        logger.info("ModelService initialized successfully with trained ML pipeline.")
    except Exception as e:
        logger.error(f"Model initialization failed on startup: {e}")
        # Allow server to start in degraded mode so /health and docs are available

    yield

    logger.info(f"Shutting down {settings.APP_NAME} ...")


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "CropIQ: AI-Powered Crop Yield Intelligence API\n\n"
        "**Pipeline**: Farm Observation → ML Yield Prediction → Explainability (SHAP) → "
        "Risk Assessment → Agronomic Recommendations → What-If Scenario Simulator\n\n"
        "Target: `yield` (unit: strictly `unconfirmed`).\n"
        "Non-causal model-based associations; zero external APIs, zero LLMs, zero DB."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------
# Middleware Configuration
# ---------------------------------------------------------

# Request ID & Timing Middleware
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()

    response = await call_next(request)

    process_time_ms = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = str(process_time_ms)
    return response


# CORS Middleware (Rule 7)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Exception Handlers (Rule 40, 41)
# ---------------------------------------------------------
app.add_exception_handler(CropIQException, cropiq_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# ---------------------------------------------------------
# Router Registration (Mounted at root & /api/v1)
# ---------------------------------------------------------
ROUTERS = [
    health.router,
    model.router,
    prediction.router,
    explainability.router,
    risk.router,
    recommendations.router,
    scenarios.router,
]

for r in ROUTERS:
    app.include_router(r)
    app.include_router(r, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint welcoming clients and linking to docs."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "tagline": "Predict. Understand. Optimize.",
        "documentation": "/docs",
        "health": "/health",
        "model_info": "/model-info",
    }
