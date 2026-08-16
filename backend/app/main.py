from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import artifacts, fundamentals, genai, health
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="AI Engineering Lab API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(artifacts.router, prefix="/api")
app.include_router(fundamentals.router, prefix="/api")
app.include_router(genai.router, prefix="/api")
