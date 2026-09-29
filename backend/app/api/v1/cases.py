from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.state_machine import CaseState, validate_transition
from app.models.models import Case, VerificationChallenge, User
from app.schemas.case import (
    CaseResponse,
    FinderPossessionConfirm,
    VerificationChallengeCreate,
    VerificationAnswerSubmit,
    VerificationDecision,
)
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/cases", tags=["Cases & Verification"])


def enrich_case_response(case: Case, user: User) -> dict:
    """Safely format case response and attach verification data."""
    v_q = None
    v_a = None
    v_acc = None

    if case.verification:
        v_q = case.verification.finder_question
        # Only expose answer to the finder, the owner, or admins
        if user.id in [case.owner_id, case.finder_id] or user.role in ["ADMIN", "SUPER_ADMIN"]:
            v_a = case.verification.owner_answer
            v_acc = case.verification.is_accepted

    res = CaseResponse.from_orm(case)
    res.verification_question = v_q
    res.verification_answer = v_a
    res.verification_accepted = v_acc
    return res


@router.get("/my", response_model=List[CaseResponse])
def get_my_cases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all active and closed cases where current user is owner or finder."""
    cases = (
        db.query(Case)
        .filter((Case.owner_id == current_user.id) | (Case.finder_id == current_user.id))
        .order_by(Case.updated_at.desc())
        .all()
    )
    return [enrich_case_response(c, current_user) for c in cases]


@router.get("/{case_id}", response_model=CaseResponse)
def get_case_detail(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve complete case details, state timeline, and verification status."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    if current_user.id not in [case.owner_id, case.finder_id] and current_user.role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this case.")

    return enrich_case_response(case, current_user)


@router.post("/{case_id}/finder-possession", response_model=CaseResponse)
async def confirm_finder_possession(
    case_id: int,
    req: FinderPossessionConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Finder responds to match request:
    'I have this item' -> FINDER_CONFIRMED
    'Not my item' -> CLOSED
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    if case.finder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the finder can confirm possession.")

    current_state = CaseState(case.status)

    if req.has_possession:
        target_state = CaseState.FINDER_CONFIRMED
        validate_transition(current_state, target_state)
        case.status = target_state.value
        case.updated_at = datetime.datetime.utcnow()
        db.commit()

        await NotificationService.create_and_send(
            db=db,
            user_id=case.owner_id,
            title="Finder Confirmed Possession",
            message=f"The finder confirmed they have your item! Temporary private chat is now active.",
            notif_type="REQUEST",
            link=f"/cases/{case.id}",
        )
        AuditService.log(
            db=db,
            action="FINDER_CONFIRMED_POSSESSION",
            resource_type="CASE",
            resource_id=str(case.id),
            user_id=current_user.id,
            details=f"Finder confirmed possession for case #{case.id}",
        )
    else:
        target_state = CaseState.CLOSED
        validate_transition(current_state, target_state)
        case.status = target_state.value
        case.updated_at = datetime.datetime.utcnow()
        db.commit()

        await NotificationService.create_and_send(
            db=db,
            user_id=case.owner_id,
            title="Match Request Declined",
            message="The finder indicated that the found item does not match your description.",
            notif_type="REQUEST",
            link=f"/cases/{case.id}",
        )

    return enrich_case_response(case, current_user)


@router.post("/{case_id}/verification-challenge", response_model=CaseResponse)
async def set_verification_challenge(
    case_id: int,
    req: VerificationChallengeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Finder registers private characteristic prompt / question:
    Transitions to VERIFICATION_PENDING.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    if case.finder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the finder can set the verification challenge.")

    validate_transition(CaseState(case.status), CaseState.VERIFICATION_PENDING)
    case.status = CaseState.VERIFICATION_PENDING.value
    case.updated_at = datetime.datetime.utcnow()

    existing = db.query(VerificationChallenge).filter(VerificationChallenge.case_id == case.id).first()
    if existing:
        existing.finder_question = req.finder_question.strip()
        existing.owner_answer = None
        existing.is_accepted = None
    else:
        challenge = VerificationChallenge(
            case_id=case.id,
            finder_question=req.finder_question.strip(),
        )
        db.add(challenge)

    db.commit()

    await NotificationService.create_and_send(
        db=db,
        user_id=case.owner_id,
        title="Ownership Verification Question",
        message="The finder asked a verification question to confirm item ownership. Please submit your answer.",
        notif_type="VERIFICATION",
        link=f"/cases/{case.id}",
    )

    return enrich_case_response(case, current_user)


@router.post("/{case_id}/verification-answer", response_model=CaseResponse)
async def submit_verification_answer(
    case_id: int,
    req: VerificationAnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Owner submits private answer to the finder's distinguishing characteristic prompt."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    if case.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the item owner can submit the verification answer.")

    challenge = db.query(VerificationChallenge).filter(VerificationChallenge.case_id == case.id).first()
    if not challenge:
        raise HTTPException(status_code=400, detail="No verification question found for this case.")

    challenge.owner_answer = req.owner_answer.strip()
    case.updated_at = datetime.datetime.utcnow()
    db.commit()

    await NotificationService.create_and_send(
        db=db,
        user_id=case.finder_id,
        title="Verification Answer Submitted",
        message="The owner submitted their answer to your verification question. Please review.",
        notif_type="VERIFICATION",
        link=f"/cases/{case.id}",
    )

    return enrich_case_response(case, current_user)


@router.post("/{case_id}/verification-decision", response_model=CaseResponse)
async def decide_verification(
    case_id: int,
    req: VerificationDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Finder reviews owner's answer and marks accepted/rejected.
    If accepted -> VERIFIED.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    if case.finder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the finder can make the verification decision.")

    challenge = db.query(VerificationChallenge).filter(VerificationChallenge.case_id == case.id).first()
    if not challenge or not challenge.owner_answer:
        raise HTTPException(status_code=400, detail="Owner has not submitted an answer yet.")

    challenge.is_accepted = req.is_accepted
    challenge.verified_at = datetime.datetime.utcnow()

    if req.is_accepted:
        validate_transition(CaseState(case.status), CaseState.VERIFIED)
        case.status = CaseState.VERIFIED.value
        case.updated_at = datetime.datetime.utcnow()

        await NotificationService.create_and_send(
            db=db,
            user_id=case.owner_id,
            title="Ownership Verified!",
            message="The finder confirmed your answer! You can now propose a campus meeting time and location.",
            notif_type="VERIFICATION",
            link=f"/cases/{case.id}",
        )
    else:
        # If not accepted, keep under verification or allow dispute
        await NotificationService.create_and_send(
            db=db,
            user_id=case.owner_id,
            title="Verification Not Confirmed",
            message="The finder indicated the answer does not match the item.",
            notif_type="VERIFICATION",
            link=f"/cases/{case.id}",
        )

    db.commit()
    return enrich_case_response(case, current_user)
