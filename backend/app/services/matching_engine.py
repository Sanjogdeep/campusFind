import datetime
import math
import re
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import LostItem, FoundItem, Match, SystemSetting


def normalize_tokens(text: str) -> set:
    """Extract lowercase alphanumeric tokens, stripping common stopwords."""
    if not text:
        return set()
    stopwords = {"a", "an", "the", "in", "on", "at", "for", "with", "of", "and", "or", "to", "my", "is"}
    words = re.findall(r"\b[a-zA-Z0-9]+\b", text.lower())
    return {w for w in words if w not in stopwords and len(w) > 1}


def calculate_jaccard_similarity(tokens1: set, tokens2: set) -> float:
    """Calculate Jaccard similarity index between two token sets."""
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)


class MatchingEngine:
    @staticmethod
    def get_weights(db: Session) -> dict:
        """Fetch matching weights from DB settings or fallback to configuration."""
        weights = {
            "category": settings.MATCH_WEIGHT_CATEGORY,
            "location": settings.MATCH_WEIGHT_LOCATION,
            "date": settings.MATCH_WEIGHT_DATE,
            "keywords": settings.MATCH_WEIGHT_KEYWORDS,
            "brand": settings.MATCH_WEIGHT_BRAND,
            "color": settings.MATCH_WEIGHT_COLOR,
            "description": settings.MATCH_WEIGHT_DESCRIPTION,
        }
        # Optionally override with dynamic settings
        db_settings = db.query(SystemSetting).all()
        settings_map = {s.key: s.value for s in db_settings}
        for k in weights.keys():
            setting_key = f"MATCH_WEIGHT_{k.upper()}"
            if setting_key in settings_map:
                try:
                    weights[k] = float(settings_map[setting_key])
                except ValueError:
                    pass
        return weights

    @classmethod
    def compute_match_score(
        cls, lost: LostItem, found: FoundItem, weights: dict
    ) -> Tuple[float, dict]:
        """
        Compute deterministic multi-factor match score between LostItem and FoundItem.
        Returns total percentage (0-100) and component breakdown.
        """
        breakdown = {}

        # 1. Category match (Exact match = 1.0, otherwise 0.0)
        breakdown["category"] = 1.0 if lost.category_id == found.category_id else 0.0

        # 2. Location match (Same location = 1.0; same zone = 0.6; else 0.0)
        if lost.location_id == found.location_id:
            breakdown["location"] = 1.0
        elif (
            lost.location
            and found.location
            and lost.location.zone_code == found.location.zone_code
        ):
            breakdown["location"] = 0.6
        else:
            breakdown["location"] = 0.0

        # 3. Date proximity score (decaying linearly over 14 days)
        # Lost date should typically be <= Found date or within a close window
        days_diff = abs((found.found_date - lost.lost_date).days)
        if days_diff == 0:
            breakdown["date"] = 1.0
        elif days_diff <= 14:
            breakdown["date"] = max(0.0, 1.0 - (days_diff / 14.0))
        else:
            breakdown["date"] = 0.0

        # 4. Item Title / Keyword overlap
        lost_title_tokens = normalize_tokens(lost.title)
        found_title_tokens = normalize_tokens(found.title)
        breakdown["keywords"] = calculate_jaccard_similarity(lost_title_tokens, found_title_tokens)

        # 5. Brand similarity
        if lost.brand and found.brand:
            lost_b = lost.brand.strip().lower()
            found_b = found.brand.strip().lower()
            if lost_b == found_b:
                breakdown["brand"] = 1.0
            elif lost_b in found_b or found_b in lost_b:
                breakdown["brand"] = 0.7
            else:
                breakdown["brand"] = 0.0
        elif not lost.brand and not found.brand:
            breakdown["brand"] = 0.5  # Neutral
        else:
            breakdown["brand"] = 0.2

        # 6. Color similarity
        if lost.color and found.color:
            lost_c = lost.color.strip().lower()
            found_c = found.color.strip().lower()
            breakdown["color"] = 1.0 if lost_c == found_c else 0.0
        elif not lost.color and not found.color:
            breakdown["color"] = 0.5
        else:
            breakdown["color"] = 0.2

        # 7. Description similarity
        lost_desc_tokens = normalize_tokens(lost.description)
        found_desc_tokens = normalize_tokens(found.description)
        breakdown["description"] = calculate_jaccard_similarity(lost_desc_tokens, found_desc_tokens)

        # Total weighted score
        total_raw = (
            weights["category"] * breakdown["category"]
            + weights["location"] * breakdown["location"]
            + weights["date"] * breakdown["date"]
            + weights["keywords"] * breakdown["keywords"]
            + weights["brand"] * breakdown["brand"]
            + weights["color"] * breakdown["color"]
            + weights["description"] * breakdown["description"]
        )

        total_percentage = round(min(100.0, max(0.0, total_raw * 100)), 1)
        return total_percentage, breakdown

    @classmethod
    def find_matches_for_lost_item(cls, db: Session, lost_item: LostItem) -> List[Match]:
        """Search active found items and register suggested matches."""
        weights = cls.get_weights(db)
        found_items = (
            db.query(FoundItem)
            .filter(FoundItem.status == "ACTIVE", FoundItem.has_item == True)
            .all()
        )

        matches_created = []
        for found in found_items:
            score, breakdown = cls.compute_match_score(lost_item, found, weights)
            if score >= (settings.MATCH_MIN_THRESHOLD * 100):
                # Check if match already exists
                existing = (
                    db.query(Match)
                    .filter(
                        Match.lost_item_id == lost_item.id,
                        Match.found_item_id == found.id,
                    )
                    .first()
                )
                if not existing:
                    match = Match(
                        lost_item_id=lost_item.id,
                        found_item_id=found.id,
                        match_score=score,
                        category_score=round(breakdown["category"] * 100, 1),
                        location_score=round(breakdown["location"] * 100, 1),
                        date_score=round(breakdown["date"] * 100, 1),
                        keyword_score=round(breakdown["keywords"] * 100, 1),
                        brand_score=round(breakdown["brand"] * 100, 1),
                        color_score=round(breakdown["color"] * 100, 1),
                        status="SUGGESTED",
                    )
                    db.add(match)
                    matches_created.append(match)
                else:
                    existing.match_score = score
                    existing.category_score = round(breakdown["category"] * 100, 1)
                    existing.location_score = round(breakdown["location"] * 100, 1)
                    existing.date_score = round(breakdown["date"] * 100, 1)
                    existing.keyword_score = round(breakdown["keywords"] * 100, 1)
                    existing.brand_score = round(breakdown["brand"] * 100, 1)
                    existing.color_score = round(breakdown["color"] * 100, 1)
                    matches_created.append(existing)

        db.commit()
        return matches_created

    @classmethod
    def find_matches_for_found_item(cls, db: Session, found_item: FoundItem) -> List[Match]:
        """Search active lost items and register suggested matches."""
        weights = cls.get_weights(db)
        lost_items = (
            db.query(LostItem)
            .filter(LostItem.status == "ACTIVE")
            .all()
        )

        matches_created = []
        for lost in lost_items:
            score, breakdown = cls.compute_match_score(lost, found_item, weights)
            if score >= (settings.MATCH_MIN_THRESHOLD * 100):
                existing = (
                    db.query(Match)
                    .filter(
                        Match.lost_item_id == lost.id,
                        Match.found_item_id == found_item.id,
                    )
                    .first()
                )
                if not existing:
                    match = Match(
                        lost_item_id=lost.id,
                        found_item_id=found_item.id,
                        match_score=score,
                        category_score=round(breakdown["category"] * 100, 1),
                        location_score=round(breakdown["location"] * 100, 1),
                        date_score=round(breakdown["date"] * 100, 1),
                        keyword_score=round(breakdown["keywords"] * 100, 1),
                        brand_score=round(breakdown["brand"] * 100, 1),
                        color_score=round(breakdown["color"] * 100, 1),
                        status="SUGGESTED",
                    )
                    db.add(match)
                    matches_created.append(match)
                else:
                    existing.match_score = score
                    existing.category_score = round(breakdown["category"] * 100, 1)
                    existing.location_score = round(breakdown["location"] * 100, 1)
                    existing.date_score = round(breakdown["date"] * 100, 1)
                    existing.keyword_score = round(breakdown["keywords"] * 100, 1)
                    existing.brand_score = round(breakdown["brand"] * 100, 1)
                    existing.color_score = round(breakdown["color"] * 100, 1)
                    matches_created.append(existing)

        db.commit()
        return matches_created
