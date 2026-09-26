import os
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusFind"
    API_V1_STR: str = "/api/v1"
    
    # Security & Tokens
    SECRET_KEY: str = "campusfind-super-secret-key-change-in-production-2026-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # College email domains (comma-separated, e.g. "lpu.in,lovely.lpu.in,example.edu")
    COLLEGE_EMAIL_DOMAIN: str = "lpu.in,lovely.lpu.in,example.edu"
    
    # Database
    DATABASE_URL: str = "sqlite:///./campusfind.db"
    
    # Rate Limiting
    RATE_LIMIT_LOGIN_MAX: int = 5
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = 60
    RATE_LIMIT_MATCH_REQUEST_MAX: int = 10
    RATE_LIMIT_MATCH_REQUEST_WINDOW_SECONDS: int = 3600
    
    # Matching Algorithm Default Weights (Sum = 1.0)
    MATCH_WEIGHT_CATEGORY: float = 0.25
    MATCH_WEIGHT_LOCATION: float = 0.20
    MATCH_WEIGHT_DATE: float = 0.20
    MATCH_WEIGHT_KEYWORDS: float = 0.15
    MATCH_WEIGHT_BRAND: float = 0.10
    MATCH_WEIGHT_COLOR: float = 0.05
    MATCH_WEIGHT_DESCRIPTION: float = 0.05
    MATCH_MIN_THRESHOLD: float = 0.40  # minimum score to trigger "Possible Match"
    
    # Handover Settings
    HANDOVER_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    MAX_IMAGE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

    @property
    def allowed_domains(self) -> List[str]:
        return [d.strip().lower() for d in self.COLLEGE_EMAIL_DOMAIN.split(",") if d.strip()]


settings = Settings()
