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
        # Exact block numbering aligned with official LPU campus layout
        lpu_locations = [
            (
                "Block 37 (Central Library)",
                "ZONE_ACADEMIC",
                "Dr. Baldev Raj Mittal 9-story Central Library entrance foyer with security turnstiles & CCTV",
                45.0, 42.0,
                31.2535, 75.7028,
                True,
            ),
            (
                "Block 30 (Central Admission Block)",
                "ZONE_ADMISSION",
                "Central admission foyer, counseling desks, university reception, and main administrative hall",
                42.0, 56.0,
                31.2529, 75.7031,
                True,
            ),
            (
                "Block 15 (UniMall Food Court & Atrium)",
                "ZONE_MALL",
                "UniMall ground floor central atrium near food counters, student utility stores, and hospitality labs",
                58.0, 36.0,
                31.2548, 75.7042,
                True,
            ),
            (
                "Block 13 (Division of Student Welfare - DSW)",
                "ZONE_DSW",
                "DSW headquarters, student organizations, cultural affairs, and campus grievance help desk",
                46.0, 50.0,
                31.2532, 75.7034,
                True,
            ),
            (
                "Block 34 (School of Computer Science & Engineering)",
                "ZONE_ENGINEERING",
                "CSE academic department, AI/ML computing laboratories, and lecture halls near Eastern Gate",
                34.0, 44.0,
                31.2534, 75.7019,
                False,
            ),
            (
                "Block 32 & 33 (Computer Science & Engineering)",
                "ZONE_ENGINEERING",
                "CSE computing laboratories, lecture complex, and faculty cabins",
                36.0, 38.0,
                31.2541, 75.7019,
                False,
            ),
            (
                "Block 36 (School of Electronics & Electrical Engineering)",
                "ZONE_ENGINEERING",
                "EEE & Robotics labs, circuit fabrication suites, and university accounts department",
                37.0, 48.0,
                31.2532, 75.7021,
                False,
            ),
            (
                "Block 38 (School of Computer Applications)",
                "ZONE_ENGINEERING",
                "Computer applications labs, software testing studios, and computing lecture halls",
                43.0, 39.0,
                31.2538, 75.7026,
                False,
            ),
            (
                "Block 25-29 (Mittal School of Business & AO)",
                "ZONE_MANAGEMENT",
                "School of Business, administrative offices (AO), conference board room, and basic sciences",
                38.0, 28.0,
                31.2550, 75.7025,
                False,
            ),
            (
                "Block 3 (UniHospital & Health Centre)",
                "ZONE_HEALTH",
                "On-campus 24/7 healthcare center reception, outpatient clinic, and pharmacy dispensary",
                48.0, 22.0,
                31.2558, 75.7035,
                True,
            ),
            (
                "Block 14 (Polytechnic & Mechanical Workshops)",
                "ZONE_ENGINEERING",
                "Polytechnic lecture halls, mechanical engineering workshops, and robotics labs",
                48.0, 52.0,
                31.2530, 75.7037,
                False,
            ),
            (
                "Block 1 (School of Fashion Design & Historic Gate)",
                "ZONE_ACADEMIC",
                "School of Fashion Design and historic foundation wing near Main Gate 1",
                62.0, 20.0,
                31.2558, 75.7048,
                False,
            ),
            (
                "Block 4 (School of Pharmaceutical Sciences)",
                "ZONE_ACADEMIC",
                "School of Pharmaceutical Sciences, clinical labs, and medicinal chemistry facilities",
                52.0, 24.0,
                31.2552, 75.7038,
                False,
            ),
            (
                "Baldev Raj Mittal Unipolis",
                "ZONE_CENTRAL",
                "Central open-air amphitheater, stage promenade, and major university event hub",
                52.0, 48.0,
                31.2539, 75.7039,
                True,
            ),
            (
                "Shanti Devi Mittal Indoor Sports Complex",
                "ZONE_SPORTS",
                "Olympic-standard indoor sports arena, badminton courts, swimming pool, and gym lobby",
                26.0, 68.0,
                31.2515, 75.7012,
                True,
            ),
            (
                "Main Gate 1 & Security Station (G.T. Road)",
                "ZONE_SECURITY",
                "24/7 manned security pavilion, visitor pass desk, and boom barriers at primary highway entrance",
                68.0, 16.0,
                31.2562, 75.7051,
                True,
            ),
            (
                "Law Gate & Western Market Station",
                "ZONE_SECURITY",
                "Western campus pedestrian gate, commercial shopping arcade, and student transit hub",
                14.0, 60.0,
                31.2524, 75.6958,
                True,
            ),
            (
                "BH-4 & GH-2 Courtyard Hub",
                "ZONE_RESIDENTIAL",
                "Boys & Girls hostel common quad, outdoor cafeteria, and student tuck shop",
                72.0, 62.0,
                31.2520, 75.7055,
                False,
            ),
            (
                "Block 55-58 (The Village - Civil & Agri Engineering)",
                "ZONE_ENGINEERING",
                "Civil engineering concrete labs, agricultural fields, surveying studios, and workshop cluster",
                60.0, 75.0,
                31.2510, 75.7045,
                False,
            ),
        ]

        # Migrate any previous records with outdated names
        rename_migrations = [
            ("%Block 34-38%", "Block 37 (Central Library)"),
            ("%Central Library%", "Block 37 (Central Library)"),
            ("%UniMall%", "Block 15 (UniMall Food Court & Atrium)"),
            ("%UniHospital%", "Block 3 (UniHospital & Health Centre)"),
            ("%Block 30%", "Block 30 (Central Admission Block)"),
            ("%Block 13%", "Block 13 (Division of Student Welfare - DSW)"),
            ("%Block 14%", "Block 14 (Polytechnic & Mechanical Workshops)"),
            ("%Block 25%", "Block 25-29 (Mittal School of Business & AO)"),
            ("%Block 32%", "Block 32 & 33 (Computer Science & Engineering)"),
        ]
        for pattern, new_name in rename_migrations:
            old_recs = db.query(CampusLocation).filter(CampusLocation.name.ilike(pattern)).all()
            for old_rec in old_recs:
                if old_rec.name != new_name:
                    old_rec.name = new_name
            db.commit()

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
