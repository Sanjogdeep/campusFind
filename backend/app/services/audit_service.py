import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import AuditLog


class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        details: Optional[str] = None,
    ) -> AuditLog:
        """Create structured audit log entry."""
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            details=details,
            timestamp=datetime.datetime.utcnow(),
        )
        db.add(log_entry)
        db.commit()
        return log_entry
