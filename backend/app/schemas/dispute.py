import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DisputeCreate(BaseModel):
    case_id: int
    reason: str = Field(..., description="NO_SHOW, WRONG_ITEM, DAMAGED, HARASSMENT, FALSE_CLAIM, SUSPICIOUS, OTHER")
    description: str = Field(..., min_length=10)


class DisputeResponse(BaseModel):
    id: int
    case_id: int
    raised_by_id: int
    raised_by_name: Optional[str] = None
    reason: str
    description: str
    admin_notes: Optional[str] = None
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class DisputeResolveRequest(BaseModel):
    resolution: str = Field(..., description="'CLOSE_CASE', 'RETRY_MEETING', 'CONFIRM_RETURN', 'DISMISS'")
    admin_notes: str
    suspend_user_id: Optional[int] = None
