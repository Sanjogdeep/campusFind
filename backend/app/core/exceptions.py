from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("campusfind")


class CampusFindException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ResourceNotFoundError(CampusFindException):
    def __init__(self, resource: str, identifier: str = ""):
        super().__init__(f"{resource} {identifier} was not found.", status_code=404)


class UnauthorizedActionError(CampusFindException):
    def __init__(self, message: str = "You are not authorized to perform this action."):
        super().__init__(message, status_code=403)


class ConcurrencyConflictError(CampusFindException):
    def __init__(self, message: str = "A conflicting update occurred. Please refresh and try again."):
        super().__init__(message, status_code=409)


async def campusfind_exception_handler(request: Request, exc: CampusFindException):
    logger.warning(f"CampusFindException on {request.url.path}: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "error_type": exc.__class__.__name__},
    )


async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )
