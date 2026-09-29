from typing import List
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.state_machine import CaseState, validate_transition
from app.models.models import Case, Meeting, CampusLocation, User
from app.schemas.meeting import MeetingCreate, MeetingResponse, MeetingAction
from app.schemas.item import LocationResponse
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/meetings", tags=["Meeting Scheduler"])


@router.get("/locations", response_model=List[LocationResponse])
def get_campus_meeting_locations(db: Session = Depends(get_db)):
    """Retrieve official campus-designated safe meeting locations."""
    locations = (
        db.query(CampusLocation)
        .filter(CampusLocation.is_meeting_point == True)
        .order_by(CampusLocation.name.asc())
        .all()
    )
    return locations


@router.post("/{case_id}", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def propose_meeting(
    case_id: int,
    req: MeetingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Propose a meeting at a campus-designated public location."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    if current_user.id not in [case.owner_id, case.finder_id]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this case.")

    location = (
        db.query(CampusLocation)
        .filter(CampusLocation.id == req.location_id, CampusLocation.is_meeting_point == True)
        .first()
    )
    if not location:
        raise HTTPException(status_code=400, detail="Invalid campus meeting location selected.")

    # State transition
    validate_transition(CaseState(case.status), CaseState.MEETING_PROPOSED)
    case.status = CaseState.MEETING_PROPOSED.value
    case.updated_at = datetime.datetime.utcnow()

    meeting = Meeting(
        case_id=case.id,
        location_id=location.id,
        scheduled_time=req.scheduled_time,
        proposer_id=current_user.id,
        status="PROPOSED",
        notes=req.notes,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    other_user_id = case.finder_id if current_user.id == case.owner_id else case.owner_id
    await NotificationService.create_and_send(
        db=db,
        user_id=other_user_id,
        title="Handover Meeting Proposed",
        message=f"{current_user.name} proposed meeting at '{location.name}' for {req.scheduled_time.strftime('%b %d at %I:%M %p')}.",
        notif_type="MEETING",
        link=f"/cases/{case.id}",
    )

    AuditService.log(
        db=db,
        action="PROPOSE_MEETING",
        resource_type="MEETING",
        resource_id=str(meeting.id),
        user_id=current_user.id,
        details=f"Proposed meeting at {location.name} for case #{case.id}",
    )

    return meeting


@router.post("/{case_id}/respond", response_model=MeetingResponse)
async def respond_to_meeting(
    case_id: int,
    req: MeetingAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Accept, reject, reschedule, or cancel a proposed meeting.
    Both parties must accept the final meeting details.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    if current_user.id not in [case.owner_id, case.finder_id]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this case.")

    meeting = (
        db.query(Meeting)
        .filter(Meeting.case_id == case.id)
        .order_by(Meeting.id.desc())
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="No meeting proposal found for this case.")

    other_user_id = case.finder_id if current_user.id == case.owner_id else case.owner_id

    if req.action == "ACCEPT":
        if meeting.proposer_id == current_user.id:
            raise HTTPException(status_code=400, detail="You cannot accept your own proposed meeting.")

        meeting.status = "ACCEPTED"
        validate_transition(CaseState(case.status), CaseState.MEETING_CONFIRMED)
        case.status = CaseState.MEETING_CONFIRMED.value
        case.updated_at = datetime.datetime.utcnow()

        await NotificationService.create_and_send(
            db=db,
            user_id=other_user_id,
            title="Meeting Confirmed!",
            message=f"{current_user.name} accepted the meeting at '{meeting.location.name}' for {meeting.scheduled_time.strftime('%b %d at %I:%M %p')}.",
            notif_type="MEETING",
            link=f"/cases/{case.id}",
        )
    elif req.action == "RESCHEDULE":
        if not req.new_time or not req.new_location_id:
            raise HTTPException(status_code=400, detail="Rescheduling requires new_time and new_location_id.")
        
        meeting.status = "RESCHEDULED"
        # Create fresh proposal
        new_loc = db.query(CampusLocation).filter(CampusLocation.id == req.new_location_id).first()
        if not new_loc:
            raise HTTPException(status_code=400, detail="Invalid campus meeting location.")

        meeting = Meeting(
            case_id=case.id,
            location_id=new_loc.id,
            scheduled_time=req.new_time,
            proposer_id=current_user.id,
            status="PROPOSED",
            notes=req.notes,
        )
        db.add(meeting)
        validate_transition(CaseState(case.status), CaseState.MEETING_PROPOSED)
        case.status = CaseState.MEETING_PROPOSED.value

        await NotificationService.create_and_send(
            db=db,
            user_id=other_user_id,
            title="Meeting Rescheduled",
            message=f"{current_user.name} rescheduled the meeting to '{new_loc.name}' at {req.new_time.strftime('%b %d at %I:%M %p')}.",
            notif_type="MEETING",
            link=f"/cases/{case.id}",
        )
    elif req.action == "CANCEL":
        meeting.status = "CANCELLED"
        await NotificationService.create_and_send(
            db=db,
            user_id=other_user_id,
            title="Meeting Cancelled",
            message=f"{current_user.name} cancelled the scheduled meeting.",
            notif_type="MEETING",
            link=f"/cases/{case.id}",
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid meeting action.")

    db.commit()
    db.refresh(meeting)
    return meeting
