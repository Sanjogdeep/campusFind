import enum
from typing import Dict, Set


class CaseState(str, enum.Enum):
    LOST_REPORTED = "LOST_REPORTED"
    FOUND_REPORTED = "FOUND_REPORTED"
    POSSIBLE_MATCH = "POSSIBLE_MATCH"
    MATCH_REQUESTED = "MATCH_REQUESTED"
    FINDER_CONFIRMED = "FINDER_CONFIRMED"
    VERIFICATION_PENDING = "VERIFICATION_PENDING"
    VERIFIED = "VERIFIED"
    MEETING_PROPOSED = "MEETING_PROPOSED"
    MEETING_CONFIRMED = "MEETING_CONFIRMED"
    HANDOVER_PENDING = "HANDOVER_PENDING"
    RETURNED = "RETURNED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
    DISPUTED = "DISPUTED"


# Non-bypassable valid state transitions
VALID_TRANSITIONS: Dict[CaseState, Set[CaseState]] = {
    CaseState.LOST_REPORTED: {
        CaseState.POSSIBLE_MATCH,
        CaseState.CANCELLED,
        CaseState.CLOSED,
    },
    CaseState.FOUND_REPORTED: {
        CaseState.POSSIBLE_MATCH,
        CaseState.CANCELLED,
        CaseState.CLOSED,
    },
    CaseState.POSSIBLE_MATCH: {
        CaseState.MATCH_REQUESTED,
        CaseState.CANCELLED,
        CaseState.CLOSED,
    },
    CaseState.MATCH_REQUESTED: {
        CaseState.FINDER_CONFIRMED,
        CaseState.CANCELLED,
        CaseState.CLOSED,  # Finder rejects ("Not my item")
    },
    CaseState.FINDER_CONFIRMED: {
        CaseState.VERIFICATION_PENDING,
        CaseState.DISPUTED,
        CaseState.CANCELLED,
    },
    CaseState.VERIFICATION_PENDING: {
        CaseState.VERIFIED,
        CaseState.DISPUTED,
        CaseState.CANCELLED,
        CaseState.CLOSED,  # verification failed
    },
    CaseState.VERIFIED: {
        CaseState.MEETING_PROPOSED,
        CaseState.DISPUTED,
        CaseState.CANCELLED,
    },
    CaseState.MEETING_PROPOSED: {
        CaseState.MEETING_CONFIRMED,
        CaseState.MEETING_PROPOSED,  # Reschedule
        CaseState.DISPUTED,
        CaseState.CANCELLED,
    },
    CaseState.MEETING_CONFIRMED: {
        CaseState.HANDOVER_PENDING,
        CaseState.MEETING_PROPOSED,  # Reschedule before window
        CaseState.DISPUTED,
        CaseState.CANCELLED,
    },
    CaseState.HANDOVER_PENDING: {
        CaseState.RETURNED,
        CaseState.DISPUTED,
        CaseState.MEETING_PROPOSED,  # Reschedule if missed
        CaseState.CANCELLED,
    },
    CaseState.RETURNED: {
        CaseState.CLOSED,
        CaseState.DISPUTED,  # Authorized dispute post-handover
    },
    CaseState.DISPUTED: {
        CaseState.CLOSED,            # Admin resolved/closed
        CaseState.MEETING_PROPOSED,  # Admin allowed retry/reschedule
        CaseState.RETURNED,          # Admin verified handover after review
        CaseState.CANCELLED,
    },
    CaseState.CLOSED: {
        CaseState.DISPUTED,          # Admin authorized reopening
    },
    CaseState.CANCELLED: set(),
}


class InvalidStateTransitionError(Exception):
    def __init__(self, current_state: CaseState, target_state: CaseState):
        self.current_state = current_state
        self.target_state = target_state
        super().__init__(
            f"Invalid transition from state '{current_state.value}' to '{target_state.value}'."
        )


def validate_transition(current_state: CaseState, target_state: CaseState) -> bool:
    """Validates if transition between current_state and target_state is allowed."""
    allowed = VALID_TRANSITIONS.get(current_state, set())
    if target_state not in allowed:
        raise InvalidStateTransitionError(current_state, target_state)
    return True
