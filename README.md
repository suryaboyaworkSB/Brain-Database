# 🧬 HealthSANG — Mechanistic Genomic Explorer

A chatbot that sits on top of your HealthSANG SQLite database and answers biomedical questions using Claude AI.

## Architecture

```
User (Browser)
     ↓
React Frontend  →  Deployed on Vercel
     ↓
FastAPI Backend →  Deployed on Render
     ↓
Claude (claude-sonnet)
     ↓ generates SQL + summarizes results
SQLite (healthsang.sqlite)
```

## Reasoning Modes

| Mode | Example Question |
|------|-----------------|
| 🦠 Disease | "What pathways are enriched in Parkinson's?" |
| 🧪 Gene | "What pathways involve SNCA?" |
| 💊 Drug | "Which drugs target dopamine pathways?" |

---

## Project Structure

```
healthsang/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── llm.py               # Claude integration
│   ├── requirements.txt
│   ├── render.yaml          # Render deployment config
│   ├── .env.example
│   ├── db/
│   │   ├── database.py      # SQLite connection + queries
│   │   └── healthsang.sqlite  ← PUT YOUR DB HERE
│   └── routers/
│       ├── chat.py          # POST /api/chat
│       └── schema.py        # GET /api/schema
└── frontend/
    ├── src/
    │   ├── App.jsx          # Main chat UI
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

---

## 🚀 Local Development

### 1. Backend

```bash
cd backend

# Copy your database
cp /path/to/healthsang.sqlite db/healthsang.sqlite

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run
python main.py
# API available at http://localhost:8000
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8000

# Run
npm run dev
# UI available at http://localhost:5173
```

---

## ☁️ Deployment

### Backend → Render

1. Push your code to GitHub (include `healthsang.sqlite` in `backend/db/`)
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set **Root Directory** to `backend`
5. Set **Build Command**: `pip install -r requirements.txt`
6. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add environment variable: `ANTHROPIC_API_KEY=your_key_here`
8. Deploy → note your Render URL (e.g. `https://healthsang-api.onrender.com`)

> ⚠️ SQLite file size: Render free tier has a 500MB disk limit.
> For 147GB, use Render's persistent disk or consider DuckDB + Parquet on S3.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-render-app.onrender.com`
5. Deploy → your chatbot is live!

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Send a question, get SQL + answer |
| GET | `/api/schema` | View database schema |
| GET | `/api/tables` | List all tables |
| GET | `/health` | Health check |

### Example Request

```bash
curl -X POST https://your-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What pathways are enriched in Parkinson disease?"}'
```

### Example Response

```json
{
  "answer": "The top enriched pathways in Parkinson's disease include dopamine clearance, SLC-mediated transport, and lysosome vesicle biogenesis...",
  "sql": "SELECT pathway_name FROM variant_pathway_impact JOIN variant ON ...",
  "columns": ["pathway_name", "count"],
  "rows": [["Dopamine clearance", 47], ["SLC-mediated transport", 32]],
  "intent": "disease",
  "row_count": 20
}
```

---

## ⚠️ Important Note on Database Size

Your SQLite file is 147GB. For production deployment:

**Option A — Render Persistent Disk** (simplest)
- Attach a persistent disk on Render ($0.25/GB/month)
- Upload your SQLite file there

**Option B — Convert to DuckDB + Parquet on S3** (scalable)
```python
import duckdb
duckdb.execute("COPY (SELECT * FROM sqlite_scan('healthsang.sqlite', 'variant')) TO 's3://bucket/variant.parquet'")
```

**Option C — PostgreSQL on Render** (most production-ready)
- Migrate SQLite → PostgreSQL
- Change `sqlite3` to `psycopg2` in `database.py`
