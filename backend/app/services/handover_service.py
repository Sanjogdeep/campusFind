import datetime
import secrets
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.state_machine import CaseState, validate_transition
from app.core.exceptions import CampusFindException, ConcurrencyConflictError
from app.models.models import Case, HandoverToken, User, LostItem, FoundItem, AuditLog


class HandoverService:
    @staticmethod
    def generate_token(db: Session, case_id: int) -> HandoverToken:
        """
        Generate or retrieve valid 6-digit one-time handover token and QR payload.
        """
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise CampusFindException("Case not found.", status_code=404)

        if case.status not in [
            CaseState.MEETING_CONFIRMED.value,
            CaseState.HANDOVER_PENDING.value,
        ]:
            raise CampusFindException(
                f"Handover token can only be generated when meeting is confirmed. Current state: {case.status}",
                status_code=400,
            )

        # Check existing token
        now = datetime.datetime.utcnow()
        existing = db.query(HandoverToken).filter(HandoverToken.case_id == case_id).first()
        if existing and not existing.is_redeemed and existing.expires_at > now:
            return existing

        # Generate fresh 6-digit OTP
        token_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        expires_at = now + datetime.timedelta(minutes=settings.HANDOVER_TOKEN_EXPIRE_MINUTES)
        qr_payload = f"CAMPUSFIND:CASE:{case_id}:{token_code}:{int(expires_at.timestamp())}"

        if existing:
            existing.token_code = token_code
            existing.qr_payload = qr_payload
            existing.expires_at = expires_at
            existing.finder_confirmed = False
            existing.owner_confirmed = False
            existing.is_redeemed = False
            token = existing
        else:
            token = HandoverToken(
                case_id=case_id,
                token_code=token_code,
                qr_payload=qr_payload,
                expires_at=expires_at,
                finder_confirmed=False,
                owner_confirmed=False,
                is_redeemed=False,
            )
            db.add(token)

        # Transition case to HANDOVER_PENDING if not already
        if case.status != CaseState.HANDOVER_PENDING.value:
            validate_transition(CaseState(case.status), CaseState.HANDOVER_PENDING)
            case.status = CaseState.HANDOVER_PENDING.value

        db.commit()
        db.refresh(token)
        return token

    @staticmethod
    def confirm_handover(
        db: Session,
        case_id: int,
        user_id: int,
        token_code: str,
        role_action: str,  # 'HANDED_OVER' or 'RECEIVED'
        ip_address: Optional[str] = None,
    ) -> Tuple[bool, str, Case]:
        """
        Validates token code and records party confirmation.
        When both have confirmed, atomically marks item as RETURNED.
        """
        # Concurrency safety: Lock the case and token record
        case = db.query(Case).filter(Case.id == case_id).with_for_update().first()
        if not case:
            raise CampusFindException("Case not found.", status_code=404)

        if case.status != CaseState.HANDOVER_PENDING.value:
            raise CampusFindException(
                f"Cannot confirm handover in state '{case.status}'. Must be HANDOVER_PENDING.",
                status_code=400,
            )

        token = db.query(HandoverToken).filter(HandoverToken.case_id == case_id).with_for_update().first()
        if not token:
            raise CampusFindException("No active handover token found for this case.", status_code=404)

        if token.is_redeemed:
            raise CampusFindException("This handover token has already been redeemed and invalidated.", status_code=400)

        now = datetime.datetime.utcnow()
        if token.expires_at < now:
            raise CampusFindException("Handover token has expired. Please regenerate a new token.", status_code=400)

        if token.token_code.strip() != token_code.strip():
            raise CampusFindException("Invalid handover code. Please check the code and try again.", status_code=400)

        # Check user role in case
        if user_id == case.finder_id and role_action == "HANDED_OVER":
            token.finder_confirmed = True
        elif user_id == case.owner_id and role_action == "RECEIVED":
            token.owner_confirmed = True
        else:
            raise CampusFindException(
                "Unauthorized role confirmation or invalid action for user.", status_code=403
            )

        # Check if both have confirmed
        if token.finder_confirmed and token.owner_confirmed:
            token.is_redeemed = True
            token.redeemed_at = now
            
            # State transition to RETURNED
            validate_transition(CaseState(case.status), CaseState.RETURNED)
            case.status = CaseState.RETURNED.value

            # Update item statuses
            if case.lost_item:
                case.lost_item.status = "RETURNED"
            if case.found_item:
                case.found_item.status = "RETURNED"

            # Trust & Recognition updates for finder
            finder = db.query(User).filter(User.id == case.finder_id).first()
            if finder:
                finder.items_returned_count += 1
                badges = list(finder.badges or [])
                if "Helpful Finder" not in badges:
                    badges.append("Helpful Finder")
                if finder.items_returned_count >= 5 and "5 Successful Returns" not in badges:
                    badges.append("5 Successful Returns")
                if finder.items_returned_count >= 10 and "Campus Hero" not in badges:
                    badges.append("Campus Hero")
                finder.badges = badges

            # Audit Log
            audit = AuditLog(
                user_id=user_id,
                action="CONFIRM_HANDOVER_COMPLETE",
                resource_type="CASE",
                resource_id=str(case.id),
                ip_address=ip_address,
                details=f"Item handover successfully completed for case #{case.id}",
                timestamp=now,
            )
            db.add(audit)
            db.commit()
            return True, "Handover successfully completed! The item has been returned.", case

        db.commit()
        return False, "Your confirmation was recorded. Waiting for the other party to confirm.", case
