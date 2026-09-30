from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import Notification
from app.websocket.connection_manager import ws_manager


class NotificationService:
    @staticmethod
    async def create_and_send(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notif_type: str,
        link: Optional[str] = None,
    ) -> Notification:
        """Create notification record in DB and broadcast via WebSocket."""
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type,
            link=link,
            is_read=False,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        # Real-time WebSocket dispatch
        payload = {
            "type": "NOTIFICATION",
            "data": {
                "id": notif.id,
                "title": notif.title,
                "message": notif.message,
                "notif_type": notif.type,
                "link": notif.link,
                "created_at": notif.created_at.isoformat(),
            },
        }
        await ws_manager.send_to_user(user_id, payload)
        return notif
