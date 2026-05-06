from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
from agents.hcp_agent import run_agent, extract_interaction_details

router = APIRouter()

class ChatMessage(BaseModel):
    role: str = Field(..., example="user", description="Role: 'user' or 'assistant'")
    content: str = Field(..., example="Met Dr. Patel today at AIIMS, discussed Product X efficacy.")

class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        example="Met Dr. Patel today at AIIMS, discussed Product X efficacy and dosage. She was very interested, positive sentiment. Shared brochure and sample.",
        description="Natural language description of the HCP interaction"
    )
    history: Optional[List[ChatMessage]] = Field(
        default=[],
        description="Previous chat messages for context"
    )

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI agent's reply")
    extracted_data: Optional[dict] = Field(None, description="Structured form data extracted from message")

class ExtractRequest(BaseModel):
    message: str = Field(
        ...,
        example="Met Dr. Sharma at Apollo Hospital, discussed OncoBoost Phase III trial. Positive sentiment. Shared brochure.",
        description="Natural language text to extract interaction fields from"
    )

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with AI Agent",
    description="""
Send a natural language message to the LangGraph AI agent.

The agent has 5 tools:
- **log_interaction** — Logs interaction to MySQL with LLM-generated summary
- **edit_interaction** — Edits existing interaction by ID
- **get_hcp_history** — Retrieves HCP interaction history
- **suggest_follow_up** — Generates follow-up action suggestions
- **analyze_sentiment** — Analyzes interaction sentiment

Also returns `extracted_data` with structured form fields auto-extracted from your message.

**Example message:** `"Met Dr. Patel today at AIIMS, discussed Product X efficacy. Positive sentiment. Shared brochure."`
    """
)
async def chat(request: ChatRequest):
    history = [{"role": m.role, "content": m.content} for m in request.history]
    result = await run_agent(request.message, history)
    return ChatResponse(
        response=result["response"],
        extracted_data=result.get("extracted_data")
    )


@router.post(
    "/extract",
    summary="Extract Form Fields from Text",
    description="Extracts structured HCP interaction fields from a natural language description using LLM."
)
async def extract(request: ExtractRequest):
    result = await extract_interaction_details(request.message)
    return result
