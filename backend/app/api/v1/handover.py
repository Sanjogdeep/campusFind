from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import Case, User
from app.schemas.handover import (
    HandoverTokenResponse,
    HandoverConfirmRequest,
    HandoverStatusResponse,
)
from app.services.handover_service import HandoverService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/handover", tags=["Handover Verification"])


@router.get("/{case_id}/token", response_model=HandoverTokenResponse)
def get_or_generate_handover_token(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate or retrieve active 6-digit handover OTP and QR code payload.
    Available once meeting is confirmed.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    if current_user.id not in [case.owner_id, case.finder_id] and current_user.role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this case's handover token.")

    token = HandoverService.generate_token(db, case_id)
    return token


@router.post("/{case_id}/confirm", response_model=HandoverStatusResponse)
async def confirm_handover(
    case_id: int,
    req: HandoverConfirmRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verify 6-digit token and register party confirmation.
    Finder calls with 'HANDED_OVER', Owner calls with 'RECEIVED'.
    Only when BOTH have verified and confirmed is the case closed with state 'RETURNED'.
    """
    client_ip = request.client.host if request.client else "unknown"
    is_complete, msg, case = HandoverService.confirm_handover(
        db=db,
        case_id=case_id,
        user_id=current_user.id,
        token_code=req.token_code,
        role_action=req.role_confirmation,
        ip_address=client_ip,
    )

    other_user_id = case.finder_id if current_user.id == case.owner_id else case.owner_id

    if is_complete:
        # Broadcast success notification to both
        await NotificationService.create_and_send(
            db=db,
            user_id=case.owner_id,
            title="Item Return Confirmed! 🎉",
            message=f"Handover verified! Your lost item has been officially returned. Thank you for using CampusFind!",
            notif_type="HANDOVER",
            link=f"/cases/{case.id}",
        )
        await NotificationService.create_and_send(
            db=db,
            user_id=case.finder_id,
            title="Item Return Confirmed! 🎉",
            message=f"Handover verified! Your activity and trust badges have been updated. Thank you for helping our campus!",
            notif_type="HANDOVER",
            link=f"/cases/{case.id}",
        )

    token = case.handover
    return HandoverStatusResponse(
        case_id=case.id,
        case_status=case.status,
        finder_confirmed=token.finder_confirmed if token else False,
        owner_confirmed=token.owner_confirmed if token else False,
        is_complete=is_complete,
        message=msg,
    )
