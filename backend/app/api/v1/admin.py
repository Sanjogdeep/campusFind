from typing import List, Dict, Any, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.dependencies import require_role, get_current_user
from app.models.models import (
    User,
    LostItem,
    FoundItem,
    Match,
    Case,
    Dispute,
    Category,
    CampusLocation,
    SystemSetting,
    AuditLog,
)
from app.schemas.user import UserResponse, UserAdminUpdate
from app.schemas.item import (
    CategoryBase,
    CategoryResponse,
    LocationBase,
    LocationResponse,
)
from app.schemas.admin import (
    SettingUpdate,
    SettingResponse,
    AnalyticsResponse,
    AuditLogResponse,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


@router.get("/analytics", response_model=AnalyticsResponse)
def get_admin_analytics(
    admin_user: User = Depends(require_role(["ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """Aggregated analytics, KPIs, and visualization series for admin dashboard."""
    total_users = db.query(User).count()
    lost_count = db.query(LostItem).count()
    found_count = db.query(FoundItem).count()
    matches_count = db.query(Match).count()
    
    returned_count = (
        db.query(Case)
        .filter(Case.status.in_(["RETURNED", "CLOSED"]))
        .count()
    )
    active_cases = (
        db.query(Case)
        .filter(~Case.status.in_(["CLOSED", "CANCELLED"]))
        .count()
    )
    disputes_count = db.query(Dispute).count()

    # Calculate average resolution hours for closed/returned cases
    resolved_cases = (
        db.query(Case)
        .filter(Case.status.in_(["RETURNED", "CLOSED"]))
        .all()
    )
    if resolved_cases:
        total_seconds = sum(
            (c.updated_at - c.created_at).total_seconds() for c in resolved_cases
        )
        avg_hours = round((total_seconds / len(resolved_cases)) / 3600.0, 1)
    else:
        avg_hours = 0.0

    # Categorical breakdown
    lost_by_cat = {}
    cats = db.query(Category).all()
    for cat in cats:
        c_count = db.query(LostItem).filter(LostItem.category_id == cat.id).count()
        if c_count > 0:
            lost_by_cat[cat.name] = c_count

    found_by_cat = {}
    for cat in cats:
        f_count = db.query(FoundItem).filter(FoundItem.category_id == cat.id).count()
        if f_count > 0:
            found_by_cat[cat.name] = f_count

    # Location breakdown
    reports_by_loc = {}
    locs = db.query(CampusLocation).all()
    for loc in locs:
        l_cnt = (
            db.query(LostItem).filter(LostItem.location_id == loc.id).count()
            + db.query(FoundItem).filter(FoundItem.location_id == loc.id).count()
        )
        if l_cnt > 0:
            reports_by_loc[loc.name] = l_cnt

    # Return rate
    total_reports = lost_count + found_count
    return_rate = round((returned_count / max(1, lost_count)) * 100, 1) if lost_count > 0 else 0.0

    # Monthly activity mock trend for chart
    now = datetime.datetime.utcnow()
    monthly_trend = [
        {"month": "May", "lost": 12, "found": 15, "returned": 10},
        {"month": "Jun", "lost": 18, "found": 22, "returned": 16},
        {"month": "Jul", "lost": 14, "found": 19, "returned": 13},
        {"month": "Aug", "lost": 28, "found": 31, "returned": 24},
        {"month": "Sep", "lost": lost_count, "found": found_count, "returned": returned_count},
    ]

    return AnalyticsResponse(
        total_users=total_users,
        lost_reports_count=lost_count,
        found_reports_count=found_count,
        possible_matches_count=matches_count,
        successful_returns_count=returned_count,
        active_cases_count=active_cases,
        disputes_count=disputes_count,
        average_resolution_hours=avg_hours,
        lost_by_category=lost_by_cat,
        found_by_category=found_by_cat,
        reports_by_location=reports_by_loc,
        monthly_trend=monthly_trend,
        return_rate_percentage=return_rate,
    )


@router.get("/users", response_model=List[UserResponse])
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_suspended: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    admin_user: User = Depends(require_role(["ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """List users across the university with administrative filters."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_suspended is not None:
        query = query.filter(User.is_suspended == is_suspended)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter((User.name.ilike(s)) | (User.email.ilike(s)))

    return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user_status(
    user_id: int,
    req: UserAdminUpdate,
    admin_user: User = Depends(require_role(["ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """
    Administrative management of users (suspension, role changes, badges).
    Only Super Admin can assign ADMIN or SUPER_ADMIN roles.
    """
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    if req.role and req.role != target.role:
        if admin_user.role != "SUPER_ADMIN":
            raise HTTPException(
                status_code=403,
                detail="Only Super Administrators can create or modify administrator privileges.",
            )
        target.role = req.role

    if req.is_suspended is not None:
        if target.role == "SUPER_ADMIN":
            raise HTTPException(status_code=400, detail="Cannot suspend a Super Administrator.")
        target.is_suspended = req.is_suspended

    if req.is_verified is not None:
        target.is_verified = req.is_verified

    if req.badges is not None:
        target.badges = req.badges

    db.commit()
    db.refresh(target)

    AuditService.log(
        db=db,
        action="ADMIN_UPDATE_USER",
        resource_type="USER",
        resource_id=str(target.id),
        user_id=admin_user.id,
        details=f"Admin {admin_user.email} updated user {target.email} (suspended: {target.is_suspended}, role: {target.role})",
    )
    return target


@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """List all categories."""
    return db.query(Category).order_by(Category.name.asc()).all()


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    req: CategoryBase,
    admin_user: User = Depends(require_role(["ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """Create a new item category."""
    existing = db.query(Category).filter(Category.name.ilike(req.name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="A category with this name already exists.")

    cat = Category(name=req.name.strip(), icon=req.icon, is_active=req.is_active)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/locations", response_model=List[LocationResponse])
def get_locations(db: Session = Depends(get_db)):
    """List all campus locations."""
    return db.query(CampusLocation).order_by(CampusLocation.name.asc()).all()


@router.post("/locations", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    req: LocationBase,
    admin_user: User = Depends(require_role(["ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """Create a new campus zone or designated meeting spot."""
    existing = db.query(CampusLocation).filter(CampusLocation.name.ilike(req.name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="A location with this name already exists.")

    loc = CampusLocation(
        name=req.name.strip(),
        zone_code=req.zone_code.strip(),
        description=req.description,
        map_x=req.map_x,
        map_y=req.map_y,
        is_meeting_point=req.is_meeting_point,
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.get("/settings", response_model=List[SettingResponse])
def get_system_settings(
    admin_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """Super Admin: View dynamic system settings."""
    return db.query(SystemSetting).all()


@router.put("/settings", response_model=SettingResponse)
def update_system_setting(
    req: SettingUpdate,
    admin_user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """Super Admin: Update system setting (e.g. COLLEGE_EMAIL_DOMAIN, MATCH_WEIGHTS)."""
    setting = db.query(SystemSetting).filter(SystemSetting.key == req.key).first()
    if not setting:
        setting = SystemSetting(
            key=req.key,
            value=req.value,
            description=req.description,
        )
        db.add(setting)
    else:
        setting.value = req.value
        if req.description:
            setting.description = req.description

    db.commit()
    db.refresh(setting)

    AuditService.log(
        db=db,
        action="UPDATE_SETTING",
        resource_type="SETTING",
        resource_id=setting.key,
        user_id=admin_user.id,
        details=f"Super Admin updated setting {setting.key} to {setting.value}",
    )
    return setting


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    admin_user: User = Depends(require_role(["ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """Admin & Super Admin: Inspect centralized audit logs for security, actions, and state transitions."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    results = []
    for l in logs:
        results.append(
            AuditLogResponse(
                id=l.id,
                user_id=l.user_id,
                user_email=l.user.email if l.user else None,
                action=l.action,
                resource_type=l.resource_type,
                resource_id=l.resource_id,
                ip_address=l.ip_address,
                details=l.details,
                timestamp=l.timestamp,
            )
        )
    return results
