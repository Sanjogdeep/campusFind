from typing import List
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.state_machine import CaseState, validate_transition
from app.models.models import Dispute, Case, User
from app.schemas.dispute import DisputeCreate, DisputeResponse, DisputeResolveRequest
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/disputes", tags=["Disputes & Reporting"])


@router.post("/", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
async def file_dispute(
    req: DisputeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """File a formal dispute or abuse report on an active case."""
    case = db.query(Case).filter(Case.id == req.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    if current_user.id not in [case.owner_id, case.finder_id]:
        raise HTTPException(status_code=403, detail="Only case participants can file a dispute.")

    # Transition case to DISPUTED
    validate_transition(CaseState(case.status), CaseState.DISPUTED)
    case.status = CaseState.DISPUTED.value
    case.updated_at = datetime.datetime.utcnow()

    dispute = Dispute(
        case_id=case.id,
        raised_by_id=current_user.id,
        reason=req.reason,
        description=req.description.strip(),
        status="OPEN",
    )
    db.add(dispute)
    db.commit()
    db.refresh(dispute)

    other_user_id = case.finder_id if current_user.id == case.owner_id else case.owner_id
    await NotificationService.create_and_send(
        db=db,
        user_id=other_user_id,
        title="Dispute Opened",
        message=f"A dispute has been submitted for this case ({req.reason}). A campus administrator has been notified.",
        notif_type="DISPUTE",
        link=f"/cases/{case.id}",
    )

    AuditService.log(
        db=db,
        action="FILE_DISPUTE",
        resource_type="DISPUTE",
        resource_id=str(dispute.id),
        user_id=current_user.id,
        details=f"Dispute raised: {req.reason} on case #{case.id}",
    )

    return DisputeResponse(
        id=dispute.id,
        case_id=dispute.case_id,
        raised_by_id=dispute.raised_by_id,
        raised_by_name=current_user.name,
        reason=dispute.reason,
        description=dispute.description,
        admin_notes=dispute.admin_notes,
        status=dispute.status,
        created_at=dispute.created_at,
        updated_at=dispute.updated_at,
    )


@router.get("/my", response_model=List[DisputeResponse])
def get_my_disputes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all disputes opened by current user."""
    disputes = (
        db.query(Dispute)
        .filter(Dispute.raised_by_id == current_user.id)
        .order_by(Dispute.created_at.desc())
        .all()
    )
    return disputes


@router.get("/", response_model=List[DisputeResponse])
def list_all_disputes_for_admin(
    status_filter: str = "OPEN",
    admin_user: User = Depends(require_role(["ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """Admin view: List all disputes across campus."""
    query = db.query(Dispute)
    if status_filter != "ALL":
        query = query.filter(Dispute.status == status_filter)
    disputes = query.order_by(Dispute.created_at.desc()).all()
    return disputes


@router.put("/{dispute_id}/resolve", response_model=DisputeResponse)
async def resolve_dispute(
    dispute_id: int,
    req: DisputeResolveRequest,
    admin_user: User = Depends(require_role(["ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """
    Admin resolves dispute:
    - Sets dispute status to RESOLVED
    - Updates case status (CLOSE_CASE, RETRY_MEETING, CONFIRM_RETURN)
    - Optionally suspends abusive user after careful human review
    """
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found.")

    case = dispute.case
    dispute.status = "RESOLVED"
    dispute.admin_notes = req.admin_notes
    dispute.updated_at = datetime.datetime.utcnow()

    if req.resolution == "CLOSE_CASE":
        validate_transition(CaseState(case.status), CaseState.CLOSED)
        case.status = CaseState.CLOSED.value
    elif req.resolution == "RETRY_MEETING":
        validate_transition(CaseState(case.status), CaseState.MEETING_PROPOSED)
        case.status = CaseState.MEETING_PROPOSED.value
    elif req.resolution == "CONFIRM_RETURN":
        validate_transition(CaseState(case.status), CaseState.RETURNED)
        case.status = CaseState.RETURNED.value

    # Optional human-reviewed suspension
    if req.suspend_user_id:
        target_user = db.query(User).filter(User.id == req.suspend_user_id).first()
        if target_user:
            target_user.is_suspended = True
            AuditService.log(
                db=db,
                action="SUSPEND_USER_DISPUTE",
                resource_type="USER",
                resource_id=str(target_user.id),
                user_id=admin_user.id,
                details=f"Admin {admin_user.name} suspended user {target_user.email} following dispute #{dispute.id}",
            )

    db.commit()

    # Notify parties
    msg = f"Dispute #{dispute.id} was reviewed and resolved by campus administration. Resolution: {req.resolution}."
    await NotificationService.create_and_send(db, case.owner_id, "Dispute Resolved", msg, "DISPUTE", f"/cases/{case.id}")
    await NotificationService.create_and_send(db, case.finder_id, "Dispute Resolved", msg, "DISPUTE", f"/cases/{case.id}")

    return dispute
