import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.models import (
    User,
    Category,
    CampusLocation,
    LostItem,
    FoundItem,
    SystemSetting,
    Match,
)
from app.services.matching_engine import MatchingEngine


def seed_database():
    """Initializes tables and seeds LPU Phagwara locations, categories, settings, and demo accounts."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. System Settings
        default_settings = [
            ("COLLEGE_EMAIL_DOMAIN", "lpu.in,lovely.lpu.in,example.edu", "Allowed college email domains"),
            ("COLLEGE_NAME", "Lovely Professional University", "University Name"),
            ("CAMPUS_CITY", "Phagwara, Punjab", "Campus City"),
            ("CAMPUS_LATITUDE", "31.2536", "LPU Center Latitude"),
            ("CAMPUS_LONGITUDE", "75.7037", "LPU Center Longitude"),
            ("MATCH_WEIGHT_CATEGORY", "0.25", "Weight for category match"),
            ("MATCH_WEIGHT_LOCATION", "0.20", "Weight for location match"),
            ("MATCH_WEIGHT_DATE", "0.20", "Weight for date proximity"),
            ("MATCH_WEIGHT_KEYWORDS", "0.15", "Weight for keyword token overlap"),
            ("MATCH_WEIGHT_BRAND", "0.10", "Weight for brand match"),
            ("MATCH_WEIGHT_COLOR", "0.05", "Weight for color match"),
            ("MATCH_WEIGHT_DESCRIPTION", "0.05", "Weight for description overlap"),
            ("HANDOVER_TOKEN_EXPIRE_MINUTES", "30", "Expiration window for 6-digit OTP"),
        ]
        for key, val, desc in default_settings:
            setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not setting:
                db.add(SystemSetting(key=key, value=val, description=desc))
            else:
                setting.value = val

        # 2. Categories
        categories_data = [
            ("Electronics", "laptop"),
            ("Documents", "file-text"),
            ("ID Cards", "credit-card"),
            ("Wallets", "wallet"),
            ("Keys", "key"),
            ("Bags", "briefcase"),
            ("Books", "book-open"),
            ("Clothing", "shirt"),
            ("Accessories", "watch"),
            ("Other", "help-circle"),
        ]
        for name, icon in categories_data:
            if not db.query(Category).filter(Category.name == name).first():
                db.add(Category(name=name, icon=icon, is_active=True))

        # 3. Lovely Professional University (LPU Phagwara) Campus Locations
        # Real GPS Coordinates anchored around G.T. Road, Phagwara: 31.2536° N, 75.7037° E
        lpu_locations = [
            (
                "Central Library (Block 34-38 Foyer)",
                "ZONE_ACADEMIC",
                "LPU 9-story Central Library entrance foyer with security turnstiles & CCTV",
                45.0, 42.0,
                31.2535, 75.7028,
                True,
            ),
            (
                "UniMall Food Court & Atrium",
                "ZONE_MALL",
                "UniMall ground floor central atrium near food counters and student stores",
                58.0, 36.0,
                31.2548, 75.7042,
                True,
            ),
            (
                "Baldev Raj Mittal Unipolis",
                "ZONE_CENTRAL",
                "Central open-air amphitheater and event promenade",
                52.0, 48.0,
                31.2539, 75.7039,
                True,
            ),
            (
                "Block 30 (Division of Student Welfare - DSW)",
                "ZONE_ADMIN",
                "Main student administration foyer and help desks",
                42.0, 56.0,
                31.2529, 75.7031,
                True,
            ),
            (
                "Main Gate 1 & Security Station (G.T. Road)",
                "ZONE_SECURITY",
                "24/7 manned security pavilion at the primary highway entrance",
                68.0, 16.0,
                31.2562, 75.7051,
                True,
            ),
            (
                "Shanti Devi Mittal Indoor Sports Complex",
                "ZONE_SPORTS",
                "Main sports arena reception and badminton lobby",
                26.0, 68.0,
                31.2515, 75.7012,
                True,
            ),
            (
                "Block 32 & 33 (Computer Science & Engineering)",
                "ZONE_ENGINEERING",
                "CSE computing laboratories and lecture complex",
                36.0, 38.0,
                31.2541, 75.7019,
                False,
            ),
            (
                "Block 25-28 (Mittal School of Business)",
                "ZONE_MANAGEMENT",
                "Business and economics department classrooms",
                38.0, 28.0,
                31.2550, 75.7025,
                False,
            ),
            (
                "BH-4 & GH-2 Courtyard Hub",
                "ZONE_RESIDENTIAL",
                "Boys & Girls hostel common quad and dining canteen",
                72.0, 62.0,
                31.2520, 75.7055,
                False,
            ),
            (
                "UniHospital Reception",
                "ZONE_HEALTH",
                "On-campus healthcare center front desk",
                48.0, 22.0,
                31.2558, 75.7035,
                True,
            ),
        ]

        for name, zone, desc, mx, my, lat, lng, is_meet in lpu_locations:
            loc = db.query(CampusLocation).filter(CampusLocation.name == name).first()
            if not loc:
                db.add(
                    CampusLocation(
                        name=name,
                        zone_code=zone,
                        description=desc,
                        map_x=mx,
                        map_y=my,
                        latitude=lat,
                        longitude=lng,
                        is_meeting_point=is_meet,
                    )
                )
            else:
                loc.zone_code = zone
                loc.description = desc
                loc.map_x = mx
                loc.map_y = my
                loc.latitude = lat
                loc.longitude = lng
                loc.is_meeting_point = is_meet

        db.commit()

        # 4. Demo Users (Supporting both @lpu.in and @example.edu)
        users_data = [
            (
                "alice@lpu.in",
                "Alice Sharma",
                "StudentPass123!",
                "STUDENT",
                "B.Tech CSE - LPU",
                2026,
                ["Active LPU Student"],
            ),
            (
                "bob@lpu.in",
                "Bob Singh",
                "StudentPass123!",
                "STUDENT",
                "Mechanical Engineering - LPU",
                2025,
                ["Helpful Finder", "3 Successful Returns"],
            ),
            (
                "admin@lpu.in",
                "LPU Campus Coordinator",
                "AdminPass123!",
                "ADMIN",
                "Division of Student Welfare",
                None,
                ["Verified LPU Staff"],
            ),
            (
                "superadmin@lpu.in",
                "LPU University Dean",
                "AdminPass123!",
                "SUPER_ADMIN",
                "Administration",
                None,
                ["System Master", "Faculty"],
            ),
            # Backwards compatibility accounts for test suite
            (
                "alice@example.edu",
                "Alice Smith",
                "StudentPass123!",
                "STUDENT",
                "Computer Science",
                2026,
                ["Active Member"],
            ),
            (
                "bob@example.edu",
                "Bob Johnson",
                "StudentPass123!",
                "STUDENT",
                "Mechanical Engineering",
                2025,
                ["Helpful Finder", "3 Successful Returns"],
            ),
            (
                "admin@example.edu",
                "Campus Coordinator",
                "AdminPass123!",
                "ADMIN",
                "Student Affairs",
                None,
                ["Verified Admin"],
            ),
            (
                "superadmin@example.edu",
                "Campus Dean",
                "AdminPass123!",
                "SUPER_ADMIN",
                "Administration",
                None,
                ["System Master"],
            ),
        ]

        for email, name, pw, role, dept, yr, badges in users_data:
            if not db.query(User).filter(User.email == email).first():
                u = User(
                    email=email,
                    name=name,
                    hashed_password=get_password_hash(pw),
                    role=role,
                    department=dept,
                    grad_year=yr,
                    phone_number="+91-98765-43210",
                    is_verified=True,
                    is_suspended=False,
                    badges=badges,
                    items_found_count=4 if "Bob" in name else 0,
                    items_returned_count=3 if "Bob" in name else 0,
                )
                db.add(u)

        db.commit()

        # 5. Sample LPU Lost & Found Items
        alice = db.query(User).filter(User.email == "alice@lpu.in").first()
        bob = db.query(User).filter(User.email == "bob@lpu.in").first()
        cat_elec = db.query(Category).filter(Category.name == "Electronics").first()
        cat_wallet = db.query(Category).filter(Category.name == "Wallets").first()
        loc_lib = db.query(CampusLocation).filter(CampusLocation.name.ilike("%Central Library%")).first()
        loc_mall = db.query(CampusLocation).filter(CampusLocation.name.ilike("%UniMall%")).first()

        today = datetime.date.today()

        if alice and bob and cat_elec and loc_lib:
            # Alice lost her Sony Headphones in Block 34 Central Library
            if not db.query(LostItem).filter(LostItem.title.ilike("%Sony WH-1000XM5%"), LostItem.owner_id == alice.id).first():
                lost_headphones = LostItem(
                    owner_id=alice.id,
                    category_id=cat_elec.id,
                    location_id=loc_lib.id,
                    title="Black Sony WH-1000XM5 Headphones",
                    description="Lost on the 4th floor reading hall near the western study desks or Central Library turnstiles.",
                    lost_date=today - datetime.timedelta(days=1),
                    approx_time="2:15 PM",
                    brand="Sony",
                    model="WH-1000XM5",
                    color="Black",
                    distinguishing_features="Small cyan sticker inside zipper pouch of the black protective case",
                    status="ACTIVE",
                )
                db.add(lost_headphones)
                db.commit()
                db.refresh(lost_headphones)

                # Bob found Sony headphones in Central Library and keeps it
                found_headphones = FoundItem(
                    finder_id=bob.id,
                    category_id=cat_elec.id,
                    location_id=loc_lib.id,
                    title="Black Sony Over-Ear Headphones with Case",
                    description="Found on a wooden cubicle desk in the Central Library 4th floor reading section.",
                    found_date=today - datetime.timedelta(days=1),
                    approx_time="2:40 PM",
                    brand="Sony",
                    color="Black",
                    has_item=True,  # Crucial: Finder has item
                    distinguishing_features="Distinct sticker inside carrying case",
                    status="ACTIVE",
                )
                db.add(found_headphones)
                db.commit()
                db.refresh(found_headphones)

                # Execute matching engine
                MatchingEngine.find_matches_for_lost_item(db, lost_headphones)

            # Sample lost wallet in UniMall
            if loc_mall and not db.query(LostItem).filter(LostItem.title.ilike("%Leather Wallet%"), LostItem.owner_id == alice.id).first():
                lost_wallet = LostItem(
                    owner_id=alice.id,
                    category_id=cat_wallet.id,
                    location_id=loc_mall.id,
                    title="Brown Leather Wallet with LPU Student ID",
                    description="Left near the UniMall 1st floor food counter during lunch hour.",
                    lost_date=today - datetime.timedelta(days=2),
                    approx_time="1:30 PM",
                    brand="Wildhorn",
                    color="Brown",
                    distinguishing_features="Contains LPU ID card with registration number in transparent flap",
                    status="ACTIVE",
                )
                db.add(lost_wallet)
                db.commit()

        print("LPU Phagwara database seed completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
