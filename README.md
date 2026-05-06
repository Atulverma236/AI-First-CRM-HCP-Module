#  PharmaConnect CRM – HCP Interaction Module

An AI-First CRM system for logging and managing Healthcare Professional (HCP) interactions in life sciences field operations.

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Redux Toolkit |
| Backend | Python 3.11 + FastAPI |
| AI Agent | LangGraph |
| LLM | Groq – `llama-3.3-70b-versatile` |
| Database | MySQL |
| Font | Google Inter |

##  LangGraph Agent & 5 Tools

The LangGraph agent acts as an intelligent orchestrator for HCP interaction management. It receives natural language from field reps and routes to the right tool.

### Tool 1: `log_interaction`
Captures all interaction data from the chat. Uses the Groq LLM (`llama-3.3-70b-versatile`) to:
- Generate a professional AI summary of the interaction
- Extract key entities (HCP name, topics, sentiment)
- Store structured data to PostgreSQL

### Tool 2: `edit_interaction`
Allows modification of previously logged interactions by ID:
- Updates only the provided fields
- Regenerates the AI summary after editing
- Updates the `updated_at` timestamp

### Tool 3: `get_hcp_history`
Retrieves full interaction history for any HCP:
- Fuzzy name matching (`ILIKE`)
- Returns sorted history with AI summaries
- Useful for pre-call planning

### Tool 4: `suggest_follow_up`
Uses the LLM to generate intelligent, context-aware follow-up actions:
- Considers sentiment, topics, and outcomes
- Returns 3–5 specific, actionable tasks
- Returned as JSON array for easy parsing

### Tool 5: `analyze_sentiment`
Analyzes sentiment of interaction text:
- Returns Positive / Neutral / Negative
- Includes confidence score (0–1)
- Provides reasoning for the classification

##  Setup & Run Instructions

### Option A: Docker (Recommended – Easiest)

**Prerequisites:** Docker Desktop installed

# App is ready:
# Frontend → http://localhost:3000
# Backend API → http://localhost:8000
# API Docs → http://localhost:8000/docs

### Option B: Manual Setup (Step by Step)

#### Step 1: mysql Database

Install mysql and create the database:


# Create DB
mysql -U mysql -c "CREATE DATABASE hcp_crm;"

#### Step 2: Backend Setup


# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set:
#   DATABASE_URL=mysql+pymysql:://postgres:password@localhost:5432/hcp_crm
#   GROQ_API_KEY=your_groq_api_key_here

# Run backend
uvicorn main:app --reload --port 8000


Backend runs at: http://localhost:8000  
API Docs: http://localhost:8000/docs


#### Step 3: Frontend Setup

cd hcp-crm/frontend

# Install dependencies
npm install

# Start frontend
npm start

Frontend runs at: http://localhost:3000

##  Getting Your Groq API Key

1. Go to https://console.groq.com
2. Sign up / Log in
3. Click **API Keys** → **Create API Key**
4. Copy the key into your `.env` file as `GROQ_API_KEY=...`


##  How to Use

### Structured Form Tab
1. Open http://localhost:3000
2. Fill in HCP name, interaction type, date/time
3. Enter topics discussed and outcomes
4. Set sentiment (Positive / Neutral / Negative)
5. Add materials or samples if applicable
6. Click **Log Interaction** to save

### AI Chat Tab
1. Switch to the **AI Chat** tab
2. Type a natural description like:
   > "Met Dr. Sharma today at Apollo Hospital, discussed OncoBoost Phase III trial results. She was very receptive, positive sentiment. Shared brochure."
3. The AI will automatically:
   - Extract all details
   - Log the interaction to the database
   - Generate a summary
   - Suggest follow-up actions

##  API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/interactions/` | Create interaction |
| GET | `/api/interactions/` | List all interactions |
| GET | `/api/interactions/{id}` | Get single interaction |
| PUT | `/api/interactions/{id}` | Update interaction |
| DELETE | `/api/interactions/{id}` | Delete interaction |
| POST | `/api/agent/chat` | Chat with AI agent |
| GET | `/api/hcp/` | List all HCPs |
| POST | `/api/hcp/` | Add new HCP |


