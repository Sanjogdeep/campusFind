import datetime
import pytest
from app.models.models import LostItem, FoundItem
from app.services.matching_engine import MatchingEngine


def test_matching_high_score_same_details():
    today = datetime.date.today()
    lost = LostItem(
        id=101,
        owner_id=1,
        category_id=1,
        location_id=1,
        title="Black Sony WH-1000XM5 Headphones",
        description="Lost in library quiet study zone in black case.",
        lost_date=today,
        brand="Sony",
        color="Black",
    )
    found = FoundItem(
        id=201,
        finder_id=2,
        category_id=1,
        location_id=1,
        title="Black Sony Over-Ear Headphones",
        description="Found in library quiet study area near desks.",
        found_date=today,
        brand="Sony",
        color="Black",
        has_item=True,
    )

    weights = {
        "category": 0.25,
        "location": 0.20,
        "date": 0.20,
        "keywords": 0.15,
        "brand": 0.10,
        "color": 0.05,
        "description": 0.05,
    }

    score, breakdown = MatchingEngine.compute_match_score(lost, found, weights)
    assert score >= 75.0
    assert breakdown["category"] == 1.0
    assert breakdown["location"] == 1.0
    assert breakdown["date"] == 1.0


def test_matching_different_category_low_score():
    today = datetime.date.today()
    lost = LostItem(
        id=102,
        owner_id=1,
        category_id=1,  # Electronics
        location_id=1,
        title="Laptop Charger",
        description="White Apple 65W charger",
        lost_date=today,
    )
    found = FoundItem(
        id=202,
        finder_id=2,
        category_id=4,  # Wallets
        location_id=3,
        title="Leather Cardholder",
        description="Brown card wallet with coins",
        found_date=today,
        has_item=True,
    )

    weights = {
        "category": 0.25,
        "location": 0.20,
        "date": 0.20,
        "keywords": 0.15,
        "brand": 0.10,
        "color": 0.05,
        "description": 0.05,
    }

    score, breakdown = MatchingEngine.compute_match_score(lost, found, weights)
    assert score < 35.0
    assert breakdown["category"] == 0.0
