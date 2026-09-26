import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    department: Optional[str] = None
    grad_year: Optional[int] = None


class UserResponse(UserBase):
    id: int
    profile_image: Optional[str] = None
    phone_number: Optional[str] = None  # Returned only to the user themselves
    is_verified: bool
    is_suspended: bool
    badges: List[str] = []
    items_found_count: int
    items_returned_count: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class UserPublicResponse(BaseModel):
    """Sanitized representation showing only safe public badge/verified status."""
    id: int
    name: str
    is_verified: bool
    badges: List[str] = []
    items_found_count: int
    items_returned_count: int

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    grad_year: Optional[int] = None
    phone_number: Optional[str] = None
    profile_image: Optional[str] = None


class UserAdminUpdate(BaseModel):
    role: Optional[str] = None
    is_suspended: Optional[bool] = None
    is_verified: Optional[bool] = None
    badges: Optional[List[str]] = None
