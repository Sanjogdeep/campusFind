import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.item import LostItemPublicResponse, FoundItemPublicResponse


class MatchResponse(BaseModel):
    id: int
    lost_item_id: int
    found_item_id: int
    match_score: float  # 0 to 100
    match_label: str = "Possible Match"  # Strictly "Possible Match"
    category_score: float
    location_score: float
    date_score: float
    keyword_score: float
    brand_score: float
    color_score: float
    status: str
    created_at: datetime.datetime
    lost_item: Optional[LostItemPublicResponse] = None
    found_item: Optional[FoundItemPublicResponse] = None

    class Config:
        from_attributes = True


class MatchRequestCreate(BaseModel):
    lost_item_id: int
    found_item_id: int
    note: Optional[str] = None
