import datetime
from typing import Optional
from pydantic import BaseModel, Field


class HandoverTokenResponse(BaseModel):
    token_code: str
    qr_payload: str
    expires_at: datetime.datetime
    finder_confirmed: bool
    owner_confirmed: bool
    is_redeemed: bool


class HandoverConfirmRequest(BaseModel):
    token_code: str = Field(..., min_length=6, max_length=6)
    role_confirmation: str = Field(..., description="'HANDED_OVER' (Finder) or 'RECEIVED' (Owner)")


class HandoverStatusResponse(BaseModel):
    case_id: int
    case_status: str
    finder_confirmed: bool
    owner_confirmed: bool
    is_complete: bool
    message: str
