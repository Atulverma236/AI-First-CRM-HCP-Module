from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from db.database import get_db, Interaction, upsert_hcp
from datetime import datetime

router = APIRouter()

class InteractionCreate(BaseModel):
    hcp_name: str
    interaction_type: str = "Meeting"
    date: str = ""
    time: str = ""
    attendees: str = ""
    topics_discussed: str = ""
    materials_shared: list = []
    samples_distributed: list = []
    sentiment: str = "Neutral"
    outcomes: str = ""
    follow_up_actions: str = ""
    source: str = "form"

class InteractionUpdate(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    topics_discussed: Optional[str] = None
    outcomes: Optional[str] = None
    sentiment: Optional[str] = None
    follow_up_actions: Optional[str] = None

@router.post("/")
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    # Always upsert HCP into hcps table when form is submitted
    upsert_hcp(db, name=data.hcp_name)

    interaction = Interaction(
        hcp_name            = data.hcp_name,
        interaction_type    = data.interaction_type,
        date                = data.date or datetime.now().strftime("%Y-%m-%d"),
        time                = data.time or datetime.now().strftime("%H:%M"),
        attendees           = data.attendees,
        topics_discussed    = data.topics_discussed,
        materials_shared    = data.materials_shared,
        samples_distributed = data.samples_distributed,
        sentiment           = data.sentiment,
        outcomes            = data.outcomes,
        follow_up_actions   = data.follow_up_actions,
        source              = data.source,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction

@router.get("/")
def list_interactions(db: Session = Depends(get_db)):
    return db.query(Interaction).order_by(Interaction.created_at.desc()).all()

@router.get("/{interaction_id}")
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction

@router.put("/{interaction_id}")
def update_interaction(interaction_id: int, data: InteractionUpdate, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    for key, value in data.dict(exclude_none=True).items():
        setattr(interaction, key, value)
    interaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(interaction)
    return interaction

@router.delete("/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"message": "Deleted successfully"}
