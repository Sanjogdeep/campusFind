import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Text, Date, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="STUDENT", nullable=False)  # STUDENT, ADMIN, SUPER_ADMIN
    department = Column(String(100), nullable=True)
    grad_year = Column(Integer, nullable=True)
    phone_number = Column(String(50), nullable=True)  # STRICTLY PRIVATE
    profile_image = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=True)
    is_suspended = Column(Boolean, default=False)
    badges = Column(JSON, default=list)  # e.g. ["Helpful Finder", "5 Successful Returns"]
    items_found_count = Column(Integer, default=0)
    items_returned_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    lost_items = relationship("LostItem", back_populates="owner", cascade="all, delete-orphan")
    found_items = relationship("FoundItem", back_populates="finder", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    icon = Column(String(50), nullable=False, default="tag")
    is_active = Column(Boolean, default=True)


class CampusLocation(Base):
    __tablename__ = "campus_locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    zone_code = Column(String(50), index=True, nullable=False)  # e.g. ZONE_A, LIBRARY_ZONE
    description = Column(String(255), nullable=True)
    map_x = Column(Float, default=50.0)  # Percentage coordinates for campus schematic map (0-100)
    map_y = Column(Float, default=50.0)
    latitude = Column(Float, nullable=True, default=31.2536)  # Real GPS coordinate for LPU Phagwara
    longitude = Column(Float, nullable=True, default=75.7037)
    is_meeting_point = Column(Boolean, default=True)


class LostItem(Base):
    __tablename__ = "lost_items"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("campus_locations.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    lost_date = Column(Date, nullable=False, index=True)
    approx_time = Column(String(50), nullable=True)
    brand = Column(String(100), nullable=True, index=True)
    model = Column(String(100), nullable=True)
    color = Column(String(50), nullable=True, index=True)
    image_url = Column(String(255), nullable=True)
    distinguishing_features = Column(Text, nullable=True)  # STRICTLY PRIVATE
    status = Column(String(50), default="ACTIVE", index=True)  # ACTIVE, MATCHED, RETURNED, CLOSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="lost_items")
    category = relationship("Category")
    location = relationship("CampusLocation")


class FoundItem(Base):
    __tablename__ = "found_items"

    id = Column(Integer, primary_key=True, index=True)
    finder_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("campus_locations.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    found_date = Column(Date, nullable=False, index=True)
    approx_time = Column(String(50), nullable=True)
    brand = Column(String(100), nullable=True, index=True)
    color = Column(String(50), nullable=True, index=True)
    image_url = Column(String(255), nullable=True)
    has_item = Column(Boolean, default=True, nullable=False)  # Must be True: Finder retains item
    distinguishing_features = Column(Text, nullable=True)  # STRICTLY PRIVATE
    status = Column(String(50), default="ACTIVE", index=True)  # ACTIVE, MATCHED, RETURNED, CLOSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    finder = relationship("User", back_populates="found_items")
    category = relationship("Category")
    location = relationship("CampusLocation")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    lost_item_id = Column(Integer, ForeignKey("lost_items.id", ondelete="CASCADE"), nullable=False, index=True)
    found_item_id = Column(Integer, ForeignKey("found_items.id", ondelete="CASCADE"), nullable=False, index=True)
    match_score = Column(Float, nullable=False)  # Percentage 0-100
    category_score = Column(Float, default=0.0)
    location_score = Column(Float, default=0.0)
    date_score = Column(Float, default=0.0)
    keyword_score = Column(Float, default=0.0)
    brand_score = Column(Float, default=0.0)
    color_score = Column(Float, default=0.0)
    status = Column(String(50), default="SUGGESTED")  # SUGGESTED, REQUESTED, DISMISSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lost_item = relationship("LostItem")
    found_item = relationship("FoundItem")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    lost_item_id = Column(Integer, ForeignKey("lost_items.id"), nullable=False, index=True)
    found_item_id = Column(Integer, ForeignKey("found_items.id"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    finder_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(50), default="MATCH_REQUESTED", index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    lost_item = relationship("LostItem")
    found_item = relationship("FoundItem")
    owner = relationship("User", foreign_keys=[owner_id])
    finder = relationship("User", foreign_keys=[finder_id])
    verification = relationship("VerificationChallenge", back_populates="case", uselist=False)
    meetings = relationship("Meeting", back_populates="case", order_by="Meeting.id.desc()")
    handover = relationship("HandoverToken", back_populates="case", uselist=False)
    conversation = relationship("Conversation", back_populates="case", uselist=False)
    disputes = relationship("Dispute", back_populates="case")


class VerificationChallenge(Base):
    __tablename__ = "verification_challenges"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), unique=True, nullable=False)
    finder_question = Column(Text, nullable=False)  # Finder asks private question
    owner_answer = Column(Text, nullable=True)     # Owner provides answer
    is_accepted = Column(Boolean, nullable=True)    # Finder confirms match
    verified_at = Column(DateTime, nullable=True)

    case = relationship("Case", back_populates="verification")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("campus_locations.id"), nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    proposer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="PROPOSED")  # PROPOSED, ACCEPTED, RESCHEDULED, CANCELLED, COMPLETED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="meetings")
    location = relationship("CampusLocation")
    proposer = relationship("User")


class HandoverToken(Base):
    __tablename__ = "handover_tokens"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), unique=True, nullable=False)
    token_code = Column(String(6), nullable=False, index=True)  # 6-digit OTP
    qr_payload = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    finder_confirmed = Column(Boolean, default=False)
    owner_confirmed = Column(Boolean, default=False)
    is_redeemed = Column(Boolean, default=False)
    redeemed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="handover")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="conversation")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at.asc()")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)  # MATCH, REQUEST, MEETING, CHAT, HANDOVER, SYSTEM
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    raised_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String(100), nullable=False)  # NO_SHOW, WRONG_ITEM, DAMAGED, HARASSMENT, FALSE_CLAIM, OTHER
    description = Column(Text, nullable=False)
    admin_notes = Column(Text, nullable=True)
    status = Column(String(50), default="OPEN")  # OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="disputes")
    raised_by = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # LOGIN, CREATE_REPORT, VERIFY_HANDOVER, RESOLVE_DISPUTE
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(50), nullable=True)
    ip_address = Column(String(45), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
