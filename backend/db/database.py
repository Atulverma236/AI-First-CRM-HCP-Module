from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/hcp_crm")
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_name = Column(String(255), nullable=False)
    interaction_type = Column(String(100), default="Meeting")
    date = Column(String(20))
    time = Column(String(20))
    attendees = Column(Text)
    topics_discussed = Column(Text)
    materials_shared = Column(JSON, default=[])
    samples_distributed = Column(JSON, default=[])
    sentiment = Column(String(50), default="Neutral")
    outcomes = Column(Text)
    follow_up_actions = Column(Text)
    ai_summary = Column(Text)
    source = Column(String(20), default="form")  # 'form' or 'chat'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    specialty = Column(String(255))
    institution = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))

def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def upsert_hcp(db: Session, name: str, specialty: str = None, institution: str = None, email: str = None, phone: str = None):
    """Insert or update an HCP record"""
    hcp = db.query(HCP).filter(HCP.name == name).first()
    if hcp:
        # Update existing HCP
        if specialty:
            hcp.specialty = specialty
        if institution:
            hcp.institution = institution
        if email:
            hcp.email = email
        if phone:
            hcp.phone = phone
    else:
        # Create new HCP
        hcp = HCP(name=name, specialty=specialty, institution=institution, email=email, phone=phone)
        db.add(hcp)
    db.commit()
    db.refresh(hcp)
    return hcp
