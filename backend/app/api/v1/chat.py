from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.state_machine import CaseState
from app.models.models import Case, Conversation, Message, User
from app.schemas.chat import MessageCreate, MessageResponse, ConversationResponse
from app.websocket.connection_manager import ws_manager

router = APIRouter(prefix="/chat", tags=["Private Temporary Chat"])


def check_chat_access(case: Case, user: User):
    """Enforces that chat is only accessible after finder confirms possession, and only to case members or admins."""
    if user.id not in [case.owner_id, case.finder_id] and user.role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this conversation.")

    # Only available from FINDER_CONFIRMED onwards
    inactive_states = [CaseState.LOST_REPORTED.value, CaseState.FOUND_REPORTED.value, CaseState.POSSIBLE_MATCH.value, CaseState.MATCH_REQUESTED.value]
    if case.status in inactive_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat will unlock once the finder confirms they have the item.",
        )


@router.get("/{case_id}/messages", response_model=List[MessageResponse])
def get_case_messages(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch message history for an active case chat."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    check_chat_access(case, current_user)

    conv = db.query(Conversation).filter(Conversation.case_id == case.id).first()
    if not conv:
        return []

    # Mark unread messages as read
    db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.sender_id != current_user.id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.commit()

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    result = []
    for m in messages:
        sender_label = "Finder" if m.sender_id == case.finder_id else "Owner"
        if m.sender_id == current_user.id:
            sender_label = f"You ({sender_label})"
        result.append(
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                sender_id=m.sender_id,
                sender_name=sender_label,
                content=m.content,
                is_read=m.is_read,
                created_at=m.created_at,
            )
        )
    return result


@router.post("/{case_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    case_id: int,
    req: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a temporary chat message and broadcast to active WebSocket listeners."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    check_chat_access(case, current_user)

    if case.status in [CaseState.CLOSED.value, CaseState.CANCELLED.value]:
        raise HTTPException(status_code=400, detail="Conversation is closed for this case.")

    conv = db.query(Conversation).filter(Conversation.case_id == case.id).first()
    if not conv:
        conv = Conversation(case_id=case.id, is_active=True)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=req.content.strip(),
        is_read=False,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    sender_label = "Finder" if current_user.id == case.finder_id else "Owner"
    payload = {
        "type": "CHAT_MESSAGE",
        "case_id": case.id,
        "message": {
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "sender_name": sender_label,
            "content": msg.content,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat(),
        },
    }
    # Broadcast to websocket
    await ws_manager.broadcast_to_case(case.id, payload)

    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        sender_name="You",
        content=msg.content,
        is_read=msg.is_read,
        created_at=msg.created_at,
    )
