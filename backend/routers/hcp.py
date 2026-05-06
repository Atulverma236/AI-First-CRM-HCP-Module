from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from db.database import get_db, HCP

router = APIRouter()

class HCPCreate(BaseModel):
    name: str
    specialty: Optional[str] = ""
    institution: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""

@router.get("/")
def list_hcps(db: Session = Depends(get_db)):
    return db.query(HCP).all()

@router.post("/")
def create_hcp(data: HCPCreate, db: Session = Depends(get_db)):
    hcp = HCP(**data.dict())
    db.add(hcp)
    db.commit()
    db.refresh(hcp)
    return hcp
