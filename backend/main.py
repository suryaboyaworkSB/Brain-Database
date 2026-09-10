from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from routers.chat import router as chat_router
from routers.schema import router as schema_router

app = FastAPI(
    title="HealthSANG API",
    description="Mechanistic reasoning chatbot over HealthSANG SQLite database",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update to your Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(schema_router, prefix="/api")

@app.get("/")
def root():
    return {"status": "HealthSANG API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
