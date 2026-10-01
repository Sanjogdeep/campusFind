import pytest
from app.core.state_machine import CaseState, validate_transition, InvalidStateTransitionError


def test_valid_forward_transitions():
    assert validate_transition(CaseState.LOST_REPORTED, CaseState.POSSIBLE_MATCH) is True
    assert validate_transition(CaseState.POSSIBLE_MATCH, CaseState.MATCH_REQUESTED) is True
    assert validate_transition(CaseState.MATCH_REQUESTED, CaseState.FINDER_CONFIRMED) is True
    assert validate_transition(CaseState.FINDER_CONFIRMED, CaseState.VERIFICATION_PENDING) is True
    assert validate_transition(CaseState.VERIFICATION_PENDING, CaseState.VERIFIED) is True
    assert validate_transition(CaseState.VERIFIED, CaseState.MEETING_PROPOSED) is True
    assert validate_transition(CaseState.MEETING_PROPOSED, CaseState.MEETING_CONFIRMED) is True
    assert validate_transition(CaseState.MEETING_CONFIRMED, CaseState.HANDOVER_PENDING) is True
    assert validate_transition(CaseState.HANDOVER_PENDING, CaseState.RETURNED) is True
    assert validate_transition(CaseState.RETURNED, CaseState.CLOSED) is True


def test_disallowed_backward_transition():
    # As requested: "never: RETURNED -> POSSIBLE_MATCH"
    with pytest.raises(InvalidStateTransitionError):
        validate_transition(CaseState.RETURNED, CaseState.POSSIBLE_MATCH)


def test_dispute_transitions():
    assert validate_transition(CaseState.MEETING_CONFIRMED, CaseState.DISPUTED) is True
    assert validate_transition(CaseState.DISPUTED, CaseState.CLOSED) is True
    assert validate_transition(CaseState.DISPUTED, CaseState.MEETING_PROPOSED) is True
