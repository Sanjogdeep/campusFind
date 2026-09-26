import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.item import LocationResponse


class MeetingCreate(BaseModel):
    location_id: int
    scheduled_time: datetime.datetime
    notes: Optional[str] = None


class MeetingResponse(BaseModel):
    id: int
    case_id: int
    location_id: int
    scheduled_time: datetime.datetime
    proposer_id: int
    status: str  # PROPOSED, ACCEPTED, RESCHEDULED, CANCELLED, COMPLETED
    notes: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True


class MeetingAction(BaseModel):
    action: str = Field(..., description="ACCEPT, REJECT, RESCHEDULE, CANCEL")
    new_time: Optional[datetime.datetime] = None
    new_location_id: Optional[int] = None
    notes: Optional[str] = None
