from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import CampusLocation, LostItem, FoundItem

router = APIRouter(prefix="/map", tags=["Campus Map"])


@router.get("/zones", response_model=List[Dict[str, Any]])
def get_campus_zones_with_activity(db: Session = Depends(get_db)):
    """
    Returns campus locations with geographic percentage coordinates
    and aggregated count of active lost and found reports.
    Preserves user privacy by never exposing exact user locations.
    """
    locations = db.query(CampusLocation).all()
    results = []

    for loc in locations:
        lost_count = (
            db.query(func.count(LostItem.id))
            .filter(LostItem.location_id == loc.id, LostItem.status == "ACTIVE")
            .scalar()
            or 0
        )
        found_count = (
            db.query(func.count(FoundItem.id))
            .filter(FoundItem.location_id == loc.id, FoundItem.status == "ACTIVE")
            .scalar()
            or 0
        )

        results.append(
            {
                "id": loc.id,
                "name": loc.name,
                "zone_code": loc.zone_code,
                "description": loc.description,
                "map_x": loc.map_x,
                "map_y": loc.map_y,
                "latitude": loc.latitude or 31.2536,
                "longitude": loc.longitude or 75.7037,
                "is_meeting_point": loc.is_meeting_point,
                "active_lost_count": lost_count,
                "active_found_count": found_count,
                "total_activity": lost_count + found_count,
            }
        )

    return results
