from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_user
from app.models.models import FoundItem, User
from app.schemas.item import (
    FoundItemCreate,
    FoundItemResponse,
    FoundItemPublicResponse,
)
from app.services.matching_engine import MatchingEngine
from app.services.duplicate_detector import DuplicateDetector
from app.services.audit_service import AuditService

router = APIRouter(prefix="/found", tags=["Found Items"])


@router.post("/", response_model=FoundItemResponse, status_code=status.HTTP_201_CREATED)
def create_found_item(
    req: FoundItemCreate,
    force: bool = Query(False, description="Bypass duplicate detection warning"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Report a found item. Finder explicitly retains the item:
    Requirement: 'The person who finds an item keeps it... has_item=True'
    """
    if not req.has_item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="In CampusFind, the finder must retain the item safely until returned to the verified owner.",
        )

    if not force:
        is_dup, msg, existing_id, sim = DuplicateDetector.check_duplicate(
            db=db,
            user_id=current_user.id,
            title=req.title,
            category_id=req.category_id,
            location_id=req.location_id,
            item_date=req.found_date,
            is_lost=False,
        )
        if is_dup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{msg} Set force=true if this is a distinct report.",
            )

    found_item = FoundItem(
        finder_id=current_user.id,
        category_id=req.category_id,
        location_id=req.location_id,
        title=req.title.strip(),
        description=req.description.strip(),
        found_date=req.found_date,
        approx_time=req.approx_time,
        brand=req.brand.strip() if req.brand else None,
        color=req.color.strip() if req.color else None,
        image_url=req.image_url,
        has_item=True,  # The finder keeps the item
        distinguishing_features=req.distinguishing_features,
        status="ACTIVE",
    )
    db.add(found_item)

    # Update user's found count stats
    current_user.items_found_count += 1

    db.commit()
    db.refresh(found_item)

    # Automatically run deterministic matching engine
    MatchingEngine.find_matches_for_found_item(db, found_item)

    AuditService.log(
        db=db,
        action="CREATE_FOUND_REPORT",
        resource_type="FOUND_ITEM",
        resource_id=str(found_item.id),
        user_id=current_user.id,
        details=f"Created found item report (finder keeps item): {found_item.title}",
    )

    return found_item


@router.get("/", response_model=List[FoundItemPublicResponse])
def list_found_items(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    location_id: Optional[int] = None,
    status_filter: Optional[str] = "ACTIVE",
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Public search and listing of found items (sanitized: hides private distinguishing marks)."""
    query = db.query(FoundItem)
    if status_filter:
        query = query.filter(FoundItem.status == status_filter)
    if category_id:
        query = query.filter(FoundItem.category_id == category_id)
    if location_id:
        query = query.filter(FoundItem.location_id == location_id)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            (FoundItem.title.ilike(s))
            | (FoundItem.description.ilike(s))
            | (FoundItem.brand.ilike(s))
        )

    items = query.order_by(FoundItem.found_date.desc()).offset(skip).limit(limit).all()
    return items


@router.get("/my", response_model=List[FoundItemResponse])
def get_my_found_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all found item reports created by the current student."""
    return (
        db.query(FoundItem)
        .filter(FoundItem.finder_id == current_user.id)
        .order_by(FoundItem.created_at.desc())
        .all()
    )


@router.get("/{item_id}")
def get_found_item(
    item_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Get found item. If caller is finder or admin, returns full details.
    Otherwise returns sanitized public view.
    """
    item = db.query(FoundItem).filter(FoundItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Found item report not found.")

    is_privileged = current_user and (
        current_user.id == item.finder_id or current_user.role in ["ADMIN", "SUPER_ADMIN"]
    )
    if is_privileged:
        return FoundItemResponse.from_orm(item)
    return FoundItemPublicResponse.from_orm(item)
