import os
import json
from dotenv import load_dotenv
load_dotenv()

from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from sqlalchemy.orm import Session
from db.database import SessionLocal, Interaction
from datetime import datetime

# ─── LLM ─────────────────────────────────────────────────────────────────────
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant",
    temperature=0.2,
)

# ═════════════════════════════════════════════════════════════════════════════
# TOOL 1 — Log Interaction
# Uses LLM for: summarization + entity extraction from natural language
# Saves full structured record to MySQL database
# ═════════════════════════════════════════════════════════════════════════════
@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str,
    topics_discussed: str,
    outcomes: str = "",
    sentiment: str = "Neutral",
    attendees: str = "",
    follow_up_actions: str = "",
    materials_shared: str = "",
    samples_distributed: str = "",
    date: str = "",
    time: str = "",
) -> str:
    """
    Tool 1: Log a new HCP interaction.
    Captures all interaction data, uses LLM to generate a professional summary,
    extracts entities, and saves the full record to the MySQL database.
    """
    db: Session = SessionLocal()
    try:
        # LLM Step 1: Generate professional summary
        summary_prompt = f"""You are a pharma CRM assistant. Write a professional 2-3 sentence 
summary of this HCP interaction for a field representative's records:

HCP Name: {hcp_name}
Interaction Type: {interaction_type}
Topics Discussed: {topics_discussed}
Outcomes: {outcomes}
Sentiment: {sentiment}
Attendees: {attendees}

Write only the summary, no labels or prefixes."""

        summary_response = llm.invoke([HumanMessage(content=summary_prompt)])
        ai_summary = summary_response.content.strip()

        # LLM Step 2: Extract and normalize entities
        entity_prompt = f"""Extract key pharma entities from this text. Return ONLY JSON, no markdown:
Text: "{topics_discussed} {outcomes}"

{{"products_mentioned": ["list of drug/product names"], "key_topics": ["list of medical topics"]}}"""

        entity_response = llm.invoke([HumanMessage(content=entity_prompt)])
        try:
            raw = entity_response.content.strip().replace("```json","").replace("```","").strip()
            entities = json.loads(raw)
        except:
            entities = {}

        # Parse materials and samples from comma-separated strings
        materials = [m.strip() for m in materials_shared.split(",") if m.strip()] if materials_shared else []
        samples   = [s.strip() for s in samples_distributed.split(",") if s.strip()] if samples_distributed else []

        # Save to MySQL database
        interaction = Interaction(
            hcp_name           = hcp_name,
            interaction_type   = interaction_type,
            date               = date or datetime.now().strftime("%Y-%m-%d"),
            time               = time or datetime.now().strftime("%H:%M"),
            attendees          = attendees,
            topics_discussed   = topics_discussed,
            materials_shared   = materials,
            samples_distributed= samples,
            sentiment          = sentiment,
            outcomes           = outcomes,
            follow_up_actions  = follow_up_actions,
            ai_summary         = ai_summary,
            source             = "chat",
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)

        return (
            f"✅ Interaction logged successfully!\n"
            f"• Database ID: {interaction.id}\n"
            f"• HCP: {hcp_name}\n"
            f"• Type: {interaction_type}\n"
            f"• Sentiment: {sentiment}\n"
            f"• AI Summary: {ai_summary}\n"
            f"• Entities extracted: {json.dumps(entities)}"
        )
    except Exception as e:
        db.rollback()
        return f"❌ Error logging interaction: {str(e)}"
    finally:
        db.close()


# ═════════════════════════════════════════════════════════════════════════════
# TOOL 2 — Edit Interaction
# Fetches existing record by ID, applies changes, regenerates AI summary
# ═════════════════════════════════════════════════════════════════════════════
@tool
def edit_interaction(
    interaction_id: int,
    hcp_name: str = "",
    interaction_type: str = "",
    topics_discussed: str = "",
    outcomes: str = "",
    sentiment: str = "",
    follow_up_actions: str = "",
) -> str:
    """
    Tool 2: Edit an existing HCP interaction by its database ID.
    Only updates the fields you provide. Regenerates the AI summary after editing.
    """
    db: Session = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return f"❌ No interaction found with ID {interaction_id}. Use get_hcp_history to find valid IDs."

        # Track what changed
        changes = []
        if hcp_name:          interaction.hcp_name = hcp_name;             changes.append(f"hcp_name → {hcp_name}")
        if interaction_type:  interaction.interaction_type = interaction_type; changes.append(f"type → {interaction_type}")
        if topics_discussed:  interaction.topics_discussed = topics_discussed; changes.append(f"topics → {topics_discussed}")
        if outcomes:          interaction.outcomes = outcomes;               changes.append(f"outcomes → {outcomes}")
        if sentiment:         interaction.sentiment = sentiment;             changes.append(f"sentiment → {sentiment}")
        if follow_up_actions: interaction.follow_up_actions = follow_up_actions; changes.append(f"follow_up → {follow_up_actions}")

        # Regenerate AI summary with updated data
        summary_prompt = f"""Write a professional 2-3 sentence summary of this updated HCP interaction:
HCP: {interaction.hcp_name}, Type: {interaction.interaction_type},
Topics: {interaction.topics_discussed}, Outcomes: {interaction.outcomes}, Sentiment: {interaction.sentiment}
Write only the summary."""
        interaction.ai_summary = llm.invoke([HumanMessage(content=summary_prompt)]).content.strip()
        interaction.updated_at = datetime.utcnow()

        db.commit()
        return (
            f"✅ Interaction ID {interaction_id} updated successfully!\n"
            f"• Changes: {', '.join(changes) if changes else 'No fields changed'}\n"
            f"• New AI Summary: {interaction.ai_summary}"
        )
    except Exception as e:
        db.rollback()
        return f"❌ Error editing interaction: {str(e)}"
    finally:
        db.close()


# ═════════════════════════════════════════════════════════════════════════════
# TOOL 3 — Get HCP History
# ═════════════════════════════════════════════════════════════════════════════
@tool
def get_hcp_history(hcp_name: str) -> str:
    """
    Tool 3: Retrieve all past interactions for a specific HCP from the database.
    Returns interaction IDs (useful for edit_interaction tool).
    """
    db: Session = SessionLocal()
    try:
        interactions = db.query(Interaction)\
            .filter(Interaction.hcp_name.ilike(f"%{hcp_name}%"))\
            .order_by(Interaction.created_at.desc()).all()

        if not interactions:
            return f"No interactions found for HCP matching '{hcp_name}'"

        result = f"Found {len(interactions)} interaction(s) for '{hcp_name}':\n\n"
        for i in interactions:
            result += (
                f"• ID #{i.id} | {i.date} | {i.interaction_type}\n"
                f"  Topics: {i.topics_discussed}\n"
                f"  Sentiment: {i.sentiment} | Outcomes: {i.outcomes or 'None'}\n"
                f"  Summary: {i.ai_summary or 'N/A'}\n\n"
            )
        return result
    except Exception as e:
        return f"❌ Error: {str(e)}"
    finally:
        db.close()


# ═════════════════════════════════════════════════════════════════════════════
# TOOL 4 — Suggest Follow-Up Actions
# ═════════════════════════════════════════════════════════════════════════════
@tool
def suggest_follow_up(
    hcp_name: str,
    topics_discussed: str,
    sentiment: str,
    outcomes: str = ""
) -> str:
    """
    Tool 4: Use LLM to generate intelligent, context-aware follow-up actions
    based on the HCP interaction details and sentiment.
    """
    prompt = f"""You are a senior pharma sales coach. Based on this HCP interaction,
suggest 4-5 specific, actionable follow-up tasks for the field representative.

HCP: {hcp_name}
Topics Discussed: {topics_discussed}
Sentiment: {sentiment}
Outcomes/Agreements: {outcomes}

Format each as:
→ [Action] — [Why it matters]"""
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        return f"📋 Follow-up suggestions for {hcp_name}:\n\n{response.content}"
    except Exception as e:
        return f"❌ Error: {str(e)}"


# ═════════════════════════════════════════════════════════════════════════════
# TOOL 5 — Analyze Sentiment
# ═════════════════════════════════════════════════════════════════════════════
@tool
def analyze_sentiment(conversation_text: str) -> str:
    """
    Tool 5: Analyze the sentiment of an HCP interaction description.
    Returns Positive/Neutral/Negative with confidence score and reasoning.
    """
    prompt = f"""Analyze the HCP interaction sentiment. Be precise.

Text: "{conversation_text}"

Reply in this exact format:
Sentiment: [Positive / Neutral / Negative]
Confidence: [0.0 to 1.0]
Key signals: [specific words/phrases that indicate the sentiment]
Reasoning: [one sentence explanation]"""
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        return f"🔍 Sentiment Analysis:\n\n{response.content}"
    except Exception as e:
        return f"❌ Error: {str(e)}"


# ─── Register tools ───────────────────────────────────────────────────────────
tools        = [log_interaction, edit_interaction, get_hcp_history, suggest_follow_up, analyze_sentiment]
tools_by_name = {t.name: t for t in tools}
llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = """You are an AI assistant for a pharma CRM system helping field representatives
log and manage interactions with Healthcare Professionals (HCPs).

You have 5 tools:
1. log_interaction   — Log a new HCP interaction (uses LLM for summary + entity extraction, saves to MySQL)
2. edit_interaction  — Edit an existing interaction by database ID
3. get_hcp_history   — Get all past interactions for an HCP (shows IDs for editing)
4. suggest_follow_up — Generate intelligent follow-up action suggestions
5. analyze_sentiment — Analyze sentiment of interaction text

RULES:
- When the user describes a meeting/visit/call with an HCP → ALWAYS call log_interaction
- After logging → ALWAYS call suggest_follow_up with the same details
- When asked to edit → first call get_hcp_history to find the ID, then call edit_interaction
- Be concise, professional, and confirmatory in your final response"""


# ─── Agent graph ──────────────────────────────────────────────────────────────
class AgentState(TypedDict):
    messages: List

def agent_node(state: AgentState):
    msgs = state["messages"]
    if not any(isinstance(m, SystemMessage) for m in msgs):
        msgs = [SystemMessage(content=SYSTEM_PROMPT)] + msgs
    response = llm_with_tools.invoke(msgs)
    return {"messages": msgs + [response]}

def tool_node(state: AgentState):
    msgs  = state["messages"]
    last  = msgs[-1]
    results = []
    for tc in last.tool_calls:
        fn = tools_by_name.get(tc["name"])
        try:
            result = fn.invoke(tc["args"]) if fn else f"Unknown tool: {tc['name']}"
        except Exception as e:
            result = f"Tool error: {str(e)}"
        results.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
    return {"messages": msgs + results}

def should_continue(state: AgentState):
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END

workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)
workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("tools", "agent")
agent_graph = workflow.compile()


# ─── Extract form fields from natural language ────────────────────────────────
async def extract_interaction_details(text: str) -> dict:
    """LLM extracts structured form fields from natural language description."""
    today = datetime.now().strftime("%Y-%m-%d")
    now   = datetime.now().strftime("%H:%M")
    prompt = f"""Extract HCP interaction details from the text below.
Return ONLY a raw JSON object — no markdown, no explanation.

Text: "{text}"

JSON structure to return:
{{
  "hcp_name": "full doctor/HCP name or empty string",
  "interaction_type": "one of: Meeting, Call, Conference, Virtual Meeting, Email, Sample Drop",
  "date": "date as YYYY-MM-DD, use {today} if today is mentioned or no date given",
  "time": "time as HH:MM, use {now} if not mentioned",
  "attendees": "other people present or empty string",
  "topics_discussed": "main topics as a descriptive sentence",
  "materials_shared": ["brochure names, PDFs etc"],
  "samples_distributed": ["drug sample names etc"],
  "sentiment": "Positive or Neutral or Negative based on tone",
  "outcomes": "agreements, decisions made or empty string",
  "follow_up_actions": "next steps mentioned or empty string"
}}"""
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        raw = response.content.strip().replace("```json","").replace("```","").strip()
        data = json.loads(raw)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e), "data": {}}


# ─── Public run function ──────────────────────────────────────────────────────
async def run_agent(user_message: str, history: list = []) -> dict:
    messages = []
    for h in history:
        if h["role"] == "user":
            messages.append(HumanMessage(content=h["content"]))
        elif h["role"] == "assistant":
            messages.append(AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=user_message))

    try:
        state = await agent_graph.ainvoke({"messages": messages})
        final = state["messages"][-1]
        extracted = await extract_interaction_details(user_message)
        return {
            "response": final.content,
            "extracted_data": extracted.get("data") if extracted["success"] else None
        }
    except Exception as e:
        return {"response": f"Agent error: {str(e)}", "extracted_data": None}
