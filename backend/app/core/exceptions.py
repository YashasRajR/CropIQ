"""
CropIQ Standardized Exceptions and Error Handlers
Ensures consistent, safe, structured error responses across all API endpoints.
"""

from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from .logging import get_logger

logger = get_logger("cropiq.exceptions")


class CropIQException(Exception):
    """Base exception for all domain and API errors in CropIQ."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class ModelNotLoadedException(CropIQException):
    """Raised when the ML model pipeline is requested but not loaded."""

    def __init__(self, message: str = "ML model pipeline is not loaded or unavailable."):
        super().__init__(
            message=message,
            code="MODEL_NOT_LOADED",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class InvalidFarmInputException(CropIQException):
    """Raised when farm input fails domain or feature validation."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="INVALID_INPUT",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class UnsupportedScenarioException(CropIQException):
    """Raised when a what-if scenario attempts invalid modifications."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="UNSUPPORTED_SCENARIO",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


def format_error_response(code: str, message: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Format structured error payload."""
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        }
    }


async def cropiq_exception_handler(request: Request, exc: CropIQException) -> JSONResponse:
    """Handle custom CropIQ domain exceptions."""
    logger.warning(
        f"Domain exception on {request.method} {request.url.path}: "
        f"code={exc.code}, message={exc.message}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(code=exc.code, message=exc.message, details=exc.details),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic request validation errors."""
    error_items = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        msg = err.get("msg", "Invalid value")
        error_items.append({"field": field, "message": msg, "type": err.get("type")})

    first_msg = error_items[0]["message"] if error_items else "Request validation failed"
    first_field = error_items[0]["field"] if error_items else "unknown"

    logger.warning(
        f"Validation error on {request.method} {request.url.path}: {first_field}: {first_msg}"
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=format_error_response(
            code="INVALID_INPUT",
            message=f"Validation failed for {first_field}: {first_msg}",
            details={"validation_errors": error_items},
        ),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected internal exceptions without leaking stack traces."""
    logger.exception(
        f"Unhandled server error on {request.method} {request.url.path}: {type(exc).__name__} - {str(exc)}"
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=format_error_response(
            code="INTERNAL_ERROR",
            message="An unexpected server error occurred while processing the request. Technical details have been logged.",
            details={"error_type": type(exc).__name__},
        ),
    )
