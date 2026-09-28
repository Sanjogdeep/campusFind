import datetime
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import LostItem, FoundItem
from app.services.matching_engine import normalize_tokens, calculate_jaccard_similarity


class DuplicateDetector:
    @staticmethod
    def check_duplicate(
        db: Session,
        user_id: int,
        title: str,
        category_id: int,
        location_id: int,
        item_date: datetime.date,
        is_lost: bool = True,
    ) -> Tuple[bool, Optional[str], Optional[int], float]:
        """
        Detects if user has an existing active item report with high similarity.
        Returns: (is_potential_duplicate, message, existing_item_id, similarity_score)
        """
        input_tokens = normalize_tokens(title)

        if is_lost:
            items = (
                db.query(LostItem)
                .filter(LostItem.owner_id == user_id, LostItem.status == "ACTIVE")
                .all()
            )
        else:
            items = (
                db.query(FoundItem)
                .filter(FoundItem.finder_id == user_id, FoundItem.status == "ACTIVE")
                .all()
            )

        for item in items:
            existing_tokens = normalize_tokens(item.title)
            token_sim = calculate_jaccard_similarity(input_tokens, existing_tokens)
            same_cat = 1.0 if item.category_id == category_id else 0.0
            same_loc = 1.0 if item.location_id == location_id else 0.0
            
            existing_date = item.lost_date if is_lost else item.found_date
            date_diff = abs((item_date - existing_date).days)
            date_sim = max(0.0, 1.0 - (date_diff / 7.0)) if date_diff <= 7 else 0.0

            total_sim = (token_sim * 0.4) + (same_cat * 0.3) + (same_loc * 0.2) + (date_sim * 0.1)
            
            if total_sim >= 0.70:
                item_type = "lost report" if is_lost else "found report"
                return (
                    True,
                    f"You may already have an active {item_type} similar to this ('{item.title}').",
                    item.id,
                    round(total_sim * 100, 1),
                )

        return False, None, None, 0.0
