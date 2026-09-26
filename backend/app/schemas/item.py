import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    name: str
    icon: str = "tag"
    is_active: bool = True


class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True


class LocationBase(BaseModel):
    name: str
    zone_code: str
    description: Optional[str] = None
    map_x: float = 50.0
    map_y: float = 50.0
    latitude: Optional[float] = 31.2536
    longitude: Optional[float] = 75.7037
    is_meeting_point: bool = True


class LocationResponse(LocationBase):
    id: int

    class Config:
        from_attributes = True


# --- Lost Item Schemas ---

class LostItemCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    category_id: int
    location_id: int
    description: str = Field(..., min_length=5)
    lost_date: datetime.date
    approx_time: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    distinguishing_features: Optional[str] = None  # Private


class LostItemResponse(BaseModel):
    id: int
    owner_id: int
    category_id: int
    location_id: int
    title: str
    description: str
    lost_date: datetime.date
    approx_time: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    distinguishing_features: Optional[str] = None  # Visible only to owner/admin
    status: str
    created_at: datetime.datetime
    category: Optional[CategoryResponse] = None
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True


class LostItemPublicResponse(BaseModel):
    """Sanitized public view of lost item - hides private distinguishing features."""
    id: int
    category_id: int
    location_id: int
    title: str
    description: str
    lost_date: datetime.date
    approx_time: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    status: str
    created_at: datetime.datetime
    category: Optional[CategoryResponse] = None
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True


# --- Found Item Schemas ---

class FoundItemCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    category_id: int
    location_id: int
    description: str = Field(..., min_length=5)
    found_date: datetime.date
    approx_time: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    has_item: bool = Field(..., description="Finder must confirm: 'I currently have this item'")
    distinguishing_features: Optional[str] = None  # Private


class FoundItemResponse(BaseModel):
    id: int
    finder_id: int
    category_id: int
    location_id: int
    title: str
    description: str
    found_date: datetime.date
    approx_time: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    has_item: bool
    distinguishing_features: Optional[str] = None  # Visible only to finder/admin
    status: str
    created_at: datetime.datetime
    category: Optional[CategoryResponse] = None
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True


class FoundItemPublicResponse(BaseModel):
    """Sanitized public view of found item - hides private features & retention coordinates."""
    id: int
    category_id: int
    location_id: int
    title: str
    description: str
    found_date: datetime.date
    approx_time: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    has_item: bool
    status: str
    created_at: datetime.datetime
    category: Optional[CategoryResponse] = None
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True


# --- Duplicate Check ---

class DuplicateCheckRequest(BaseModel):
    title: str
    category_id: int
    location_id: int
    item_date: datetime.date
    is_lost_report: bool


class DuplicateCheckResponse(BaseModel):
    is_potential_duplicate: bool
    message: Optional[str] = None
    existing_item_id: Optional[int] = None
    similarity_score: float = 0.0
