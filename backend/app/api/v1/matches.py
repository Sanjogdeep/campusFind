from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.state_machine import CaseState
from app.models.models import Match, LostItem, FoundItem, Case, User, Conversation
from app.schemas.match import MatchResponse, MatchRequestCreate
from app.schemas.case import CaseResponse
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/matches", tags=["Matches"])


@router.get("/lost/{lost_id}", response_model=List[MatchResponse])
def get_matches_for_lost_item(
    lost_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all suggested possible matches for a lost item."""
    lost_item = db.query(LostItem).filter(LostItem.id == lost_id).first()
    if not lost_item:
        raise HTTPException(status_code=404, detail="Lost item report not found.")

    if lost_item.owner_id != current_user.id and current_user.role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this lost item's matches.")

    matches = (
        db.query(Match)
        .filter(Match.lost_item_id == lost_id)
        .order_by(Match.match_score.desc())
        .all()
    )
    return matches


@router.get("/found/{found_id}", response_model=List[MatchResponse])
def get_matches_for_found_item(
    found_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all suggested possible matches for a found item."""
    found_item = db.query(FoundItem).filter(FoundItem.id == found_id).first()
    if not found_item:
        raise HTTPException(status_code=404, detail="Found item report not found.")

    if found_item.finder_id != current_user.id and current_user.role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this found item's matches.")

    matches = (
        db.query(Match)
        .filter(Match.found_item_id == found_id)
        .order_by(Match.match_score.desc())
        .all()
    )
    return matches


@router.post("/request", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def request_verification(
    req: MatchRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Owner clicks 'Request Verification' on a possible match.
    Creates or updates the Case to MATCH_REQUESTED and alerts the finder.
    """
    lost_item = db.query(LostItem).filter(LostItem.id == req.lost_item_id).first()
    found_item = db.query(FoundItem).filter(FoundItem.id == req.found_item_id).first()

    if not lost_item or not found_item:
        raise HTTPException(status_code=404, detail="Lost item or found item not found.")

    if lost_item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner of the lost item can request verification.")

    if found_item.finder_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot request verification on an item you reported found.")

    # Concurrency check: Ensure no finalized or active handover case exists for this found item
    active_case = (
        db.query(Case)
        .filter(
            Case.found_item_id == found_item.id,
            Case.status.in_([
                CaseState.FINDER_CONFIRMED.value,
                CaseState.VERIFICATION_PENDING.value,
                CaseState.VERIFIED.value,
                CaseState.MEETING_PROPOSED.value,
                CaseState.MEETING_CONFIRMED.value,
                CaseState.HANDOVER_PENDING.value,
                CaseState.RETURNED.value,
            ]),
        )
        .first()
    )
    if active_case and active_case.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This found item is currently undergoing verification or handover with another potential owner.",
        )

    # Check if case already exists between these two items
    case = (
        db.query(Case)
        .filter(
            Case.lost_item_id == lost_item.id,
            Case.found_item_id == found_item.id,
        )
        .first()
    )

    if not case:
        case = Case(
            lost_item_id=lost_item.id,
            found_item_id=found_item.id,
            owner_id=current_user.id,
            finder_id=found_item.finder_id,
            status=CaseState.MATCH_REQUESTED.value,
        )
        db.add(case)
        db.commit()
        db.refresh(case)

        # Initialize conversation for case
        conv = Conversation(case_id=case.id, is_active=True)
        db.add(conv)
        db.commit()
    else:
        case.status = CaseState.MATCH_REQUESTED.value
        db.commit()

    # Update match status
    match = (
        db.query(Match)
        .filter(Match.lost_item_id == lost_item.id, Match.found_item_id == found_item.id)
        .first()
    )
    if match:
        match.status = "REQUESTED"
        db.commit()

    # Notify finder
    await NotificationService.create_and_send(
        db=db,
        user_id=found_item.finder_id,
        title="New Match Verification Request",
        message=f"Someone believes your found item '{found_item.title}' may belong to them. Please review and confirm possession.",
        notif_type="REQUEST",
        link=f"/cases/{case.id}",
    )

    AuditService.log(
        db=db,
        action="MATCH_REQUESTED",
        resource_type="CASE",
        resource_id=str(case.id),
        user_id=current_user.id,
        details=f"Owner requested verification for case #{case.id}",
    )

    return case
