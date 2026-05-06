# 🏥 PharmaConnect CRM – HCP Interaction Module

An AI-First CRM system for logging and managing Healthcare Professional (HCP) interactions in life sciences field operations.

---

## 📋 Assignment: AI-First CRM HCP Module – Log Interaction Screen

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Redux Toolkit |
| Backend | Python 3.11 + FastAPI |
| AI Agent | LangGraph |
| LLM | Groq – `llama-3.3-70b-versatile` |
| Database | MySQL |
| Font | Google Inter |

---

## 🧠 Component Architecture

```
hcp-crm/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Layout/
│       │   │   └── Header.jsx          # Top nav bar
│       │   ├── Form/
│       │   │   └── InteractionForm.jsx # Structured form UI
│       │   ├── Chat/
│       │   │   └── ChatInterface.jsx   # AI chat interface
│       │   └── UI/
│       │       ├── TabSwitcher.jsx     # Form/Chat toggle
│       │       ├── StatsBar.jsx        # Top stats cards
│       │       └── InteractionHistory.jsx  # Right panel history
│       ├── store/
│       │   ├── index.js                # Redux store
│       │   └── slices/
│       │       ├── interactionSlice.js # Form state + async thunks
│       │       ├── chatSlice.js        # Chat messages state
│       │       └── hcpSlice.js         # HCP list state
│       ├── pages/
│       │   └── LogInteraction.jsx      # Main page layout
│       └── styles/
│           └── global.css             # CSS variables + base styles
│
├── backend/
│   ├── main.py                        # FastAPI app entry
│   ├── agents/
│   │   └── hcp_agent.py              # LangGraph agent + 5 tools
│   ├── routers/
│   │   ├── interactions.py           # CRUD endpoints
│   │   ├── agent.py                  # AI chat endpoint
│   │   └── hcp.py                    # HCP list endpoints
│   └── db/
│       └── database.py               # SQLAlchemy models + DB setup
│
└── docker-compose.yml                # Full stack orchestration
```

---

## 🤖 LangGraph Agent & 5 Tools

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

---

## 🚀 Setup & Run Instructions

### Option A: Docker (Recommended – Easiest)

**Prerequisites:** Docker Desktop installed

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd hcp-crm

# 2. Set your Groq API key
echo "GROQ_API_KEY=your_groq_api_key_here" > .env

# 3. Start everything
docker-compose up --build

# App is ready:
# Frontend → http://localhost:3000
# Backend API → http://localhost:8000
# API Docs → http://localhost:8000/docs
```

---

### Option B: Manual Setup (Step by Step)

#### Step 1: mysql Database

Install mysql and create the database:


# Create DB
mysql -U mysql -c "CREATE DATABASE hcp_crm;"
```

---

#### Step 2: Backend Setup

```bash
cd hcp-crm/backend

# Create virtual environment
python -m venv venv

# Activate
# macOS/Linux:
source venv/bin/activate
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
```

Backend runs at: http://localhost:8000  
API Docs: http://localhost:8000/docs

---

#### Step 3: Frontend Setup

```bash
cd hcp-crm/frontend

# Install dependencies
npm install

# Start frontend
npm start
```

Frontend runs at: http://localhost:3000

---

## 🔑 Getting Your Groq API Key

1. Go to https://console.groq.com
2. Sign up / Log in
3. Click **API Keys** → **Create API Key**
4. Copy the key into your `.env` file as `GROQ_API_KEY=...`

---

## 🖥️ How to Use

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

---

## 📡 API Endpoints

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

---

## 📤 Submission

Submit via: https://forms.gle/g76jGd47P8T86gQ69
