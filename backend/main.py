from dotenv import load_dotenv
load_dotenv()  # Must be FIRST before any other imports

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import interactions, agent, hcp
from db.database import create_tables

app = FastAPI(title="HCP CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    create_tables()

app.include_router(interactions.router, prefix="/api/interactions", tags=["Interactions"])
app.include_router(agent.router, prefix="/api/agent", tags=["AI Agent"])
app.include_router(hcp.router, prefix="/api/hcp", tags=["HCP"])

@app.get("/")
def root():
    return {"message": "HCP CRM API running"}