import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.exceptions import (
    CampusFindException,
    campusfind_exception_handler,
    generic_exception_handler,
)
from app.api.v1.api_router import api_v1_router
from app.api.v1.websocket_routes import router as ws_router
from app.utils.seed_data import seed_database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("campusfind")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure upload directory exists and seed database
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("Initializing CampusFind database & running seeds...")
    seed_database()
    logger.info("CampusFind backend ready!")
    yield
    # Shutdown
    logger.info("CampusFind backend shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-quality college Lost & Found platform with finder-retention workflow, deterministic matching, private verification, and one-time handover token confirmation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev and preview hosts
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Exception Handlers
app.add_exception_handler(CampusFindException, campusfind_exception_handler)

# Mount Routers
app.include_router(api_v1_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)

# Mount Uploads directory for safe media serving
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "allowed_domains": settings.allowed_domains,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
