from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_user
from app.models.models import LostItem, User
from app.schemas.item import (
    LostItemCreate,
    LostItemResponse,
    LostItemPublicResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
)
from app.services.matching_engine import MatchingEngine
from app.services.duplicate_detector import DuplicateDetector
from app.services.audit_service import AuditService

router = APIRouter(prefix="/lost", tags=["Lost Items"])


@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
def check_duplicate(
    req: DuplicateCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Real-time duplicate detection check before submission."""
    is_dup, msg, existing_id, sim = DuplicateDetector.check_duplicate(
        db=db,
        user_id=current_user.id,
        title=req.title,
        category_id=req.category_id,
        location_id=req.location_id,
        item_date=req.item_date,
        is_lost=req.is_lost_report,
    )
    return DuplicateCheckResponse(
        is_potential_duplicate=is_dup,
        message=msg,
        existing_item_id=existing_id,
        similarity_score=sim,
    )


@router.post("/", response_model=LostItemResponse, status_code=status.HTTP_201_CREATED)
def create_lost_item(
    req: LostItemCreate,
    force: bool = Query(False, description="Bypass duplicate detection warning"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Report a lost item, run duplicate detection, and execute matching engine."""
    if not force:
        is_dup, msg, existing_id, sim = DuplicateDetector.check_duplicate(
            db=db,
            user_id=current_user.id,
            title=req.title,
            category_id=req.category_id,
            location_id=req.location_id,
            item_date=req.lost_date,
            is_lost=True,
        )
        if is_dup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{msg} Set force=true if this is a distinct report.",
            )

    lost_item = LostItem(
        owner_id=current_user.id,
        category_id=req.category_id,
        location_id=req.location_id,
        title=req.title.strip(),
        description=req.description.strip(),
        lost_date=req.lost_date,
        approx_time=req.approx_time,
        brand=req.brand.strip() if req.brand else None,
        model=req.model.strip() if req.model else None,
        color=req.color.strip() if req.color else None,
        image_url=req.image_url,
        distinguishing_features=req.distinguishing_features,  # Stored privately
        status="ACTIVE",
    )
    db.add(lost_item)
    db.commit()
    db.refresh(lost_item)

    # Automatically run deterministic matching engine
    MatchingEngine.find_matches_for_lost_item(db, lost_item)

    AuditService.log(
        db=db,
        action="CREATE_LOST_REPORT",
        resource_type="LOST_ITEM",
        resource_id=str(lost_item.id),
        user_id=current_user.id,
        details=f"Created lost item report: {lost_item.title}",
    )

    return lost_item


@router.get("/", response_model=List[LostItemPublicResponse])
def list_lost_items(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    location_id: Optional[int] = None,
    status_filter: Optional[str] = "ACTIVE",
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Public search and listing of lost items (sanitized: hides private distinguishing marks)."""
    query = db.query(LostItem)
    if status_filter:
        query = query.filter(LostItem.status == status_filter)
    if category_id:
        query = query.filter(LostItem.category_id == category_id)
    if location_id:
        query = query.filter(LostItem.location_id == location_id)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            (LostItem.title.ilike(s))
            | (LostItem.description.ilike(s))
            | (LostItem.brand.ilike(s))
        )

    items = query.order_by(LostItem.lost_date.desc()).offset(skip).limit(limit).all()
    return items


@router.get("/my", response_model=List[LostItemResponse])
def get_my_lost_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all lost item reports created by the current student with full private details."""
    return (
        db.query(LostItem)
        .filter(LostItem.owner_id == current_user.id)
        .order_by(LostItem.created_at.desc())
        .all()
    )


@router.get("/{item_id}")
def get_lost_item(
    item_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Get lost item. If the caller is the item owner or an admin,
    returns full details including private distinguishing marks. Otherwise, sanitized.
    """
    item = db.query(LostItem).filter(LostItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Lost item report not found.")

    is_privileged = current_user and (
        current_user.id == item.owner_id or current_user.role in ["ADMIN", "SUPER_ADMIN"]
    )
    if is_privileged:
        return LostItemResponse.from_orm(item)
    return LostItemPublicResponse.from_orm(item)
