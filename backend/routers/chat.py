from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from llm import generate_sql, summarize_results, classify_intent
from db.database import run_sql

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sql: str
    columns: list
    rows: list
    intent: str
    row_count: int


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        # Step 1: Classify intent
        intent = classify_intent(question)

        # Step 2: Generate SQL
        sql = generate_sql(question)

        # Step 3: Execute SQL
        result = run_sql(sql)

        # Step 4: Summarize with Claude
        answer = summarize_results(
            question=question,
            sql=sql,
            columns=result["columns"],
            rows=result["rows"]
        )

        return ChatResponse(
            answer=answer,
            sql=sql,
            columns=result["columns"],
            rows=result["rows"],
            intent=intent,
            row_count=result["count"]
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
