import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.item import LostItemPublicResponse, FoundItemPublicResponse
from app.schemas.user import UserPublicResponse


class VerificationChallengeCreate(BaseModel):
    finder_question: str  # Finder sets prompt asking for unique identifying characteristic


class VerificationAnswerSubmit(BaseModel):
    owner_answer: str  # Owner submits identifying answer privately


class VerificationDecision(BaseModel):
    is_accepted: bool  # Finder marks whether answer matches item


class FinderPossessionConfirm(BaseModel):
    has_possession: bool  # True: "I have this item", False: "Not my item"


class CaseResponse(BaseModel):
    id: int
    lost_item_id: int
    found_item_id: int
    owner_id: int
    finder_id: int
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    # Safe representations
    owner: Optional[UserPublicResponse] = None
    finder: Optional[UserPublicResponse] = None
    lost_item: Optional[LostItemPublicResponse] = None
    found_item: Optional[FoundItemPublicResponse] = None
    
    # Verification details (question & answer exposed only to relevant parties)
    verification_question: Optional[str] = None
    verification_answer: Optional[str] = None
    verification_accepted: Optional[bool] = None

    class Config:
        from_attributes = True
