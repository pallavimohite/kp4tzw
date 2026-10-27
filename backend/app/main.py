"""FastAPI application entry point."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router

app = FastAPI(
    title="UK Wind Forecast Monitor API",
    description="Day-ahead wind forecasts vs actuals for GB, January 2026 (Elexon BMRS data).",
    version="1.0.0",
)

# Frontend dev server runs on a different port; in production both are served from one origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(router)
