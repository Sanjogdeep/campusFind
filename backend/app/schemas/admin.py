import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.item import CategoryResponse, LocationResponse


class SettingUpdate(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class SettingResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime.datetime

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    total_users: int
    lost_reports_count: int
    found_reports_count: int
    possible_matches_count: int
    successful_returns_count: int
    active_cases_count: int
    disputes_count: int
    average_resolution_hours: float
    
    # Chart series
    lost_by_category: Dict[str, int]
    found_by_category: Dict[str, int]
    reports_by_location: Dict[str, int]
    monthly_trend: List[Dict[str, Any]]
    return_rate_percentage: float


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True
