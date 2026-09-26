import datetime
from typing import Optional, List
from pydantic import BaseModel


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str
    content: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    case_id: int
    is_active: bool
    created_at: datetime.datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True
