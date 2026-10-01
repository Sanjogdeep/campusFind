import datetime
import pytest
from app.models.models import Case, HandoverToken, User, LostItem, FoundItem
from app.services.handover_service import HandoverService
from app.core.exceptions import CampusFindException


def test_handover_full_lifecycle(db_session):
    # Setup users and items
    owner = db_session.query(User).filter(User.email == "alice@example.edu").first()
    finder = db_session.query(User).filter(User.email == "bob@example.edu").first()

    case = Case(
        lost_item_id=1,
        found_item_id=1,
        owner_id=owner.id,
        finder_id=finder.id,
        status="MEETING_CONFIRMED",
    )
    db_session.add(case)
    db_session.commit()
    db_session.refresh(case)

    # 1. Generate Token
    token = HandoverService.generate_token(db_session, case.id)
    assert len(token.token_code) == 6
    assert token.finder_confirmed is False
    assert token.owner_confirmed is False
    assert token.is_redeemed is False
    assert case.status == "HANDOVER_PENDING"

    # 2. Invalid code test
    with pytest.raises(CampusFindException):
        HandoverService.confirm_handover(
            db=db_session,
            case_id=case.id,
            user_id=finder.id,
            token_code="000000",
            role_action="HANDED_OVER",
        )

    # 3. Finder confirms first
    done, msg, case = HandoverService.confirm_handover(
        db=db_session,
        case_id=case.id,
        user_id=finder.id,
        token_code=token.token_code,
        role_action="HANDED_OVER",
    )
    assert done is False  # Not complete yet because owner hasn't confirmed
    assert token.finder_confirmed is True
    assert token.owner_confirmed is False

    # 4. Owner confirms second
    done, msg, case = HandoverService.confirm_handover(
        db=db_session,
        case_id=case.id,
        user_id=owner.id,
        token_code=token.token_code,
        role_action="RECEIVED",
    )
    assert done is True
    assert token.owner_confirmed is True
    assert token.is_redeemed is True
    assert case.status == "RETURNED"
    assert "Helpful Finder" in finder.badges
