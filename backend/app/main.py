"""
AtlasField API - FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import auth, sites, analysis, chat, alerts


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup"""
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered satellite monitoring for agriculture and forestry",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
origins = settings.CORS_ORIGINS
allow_all = "*" in origins

# Log CORS configuration
print(f"INFO: CORS allowed origins: {origins}")
if allow_all:
    print("WARNING: CORS allowed for all origins (*). Credentials (cookies) will be disabled.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=not allow_all,  # Starlette requirement: cannot use allow_credentials=True with '*'
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(sites.router, prefix=settings.API_V1_PREFIX)
app.include_router(analysis.router, prefix=settings.API_V1_PREFIX)
app.include_router(chat.router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "name": settings.APP_NAME,
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "services": {
            "sentinel_hub": "configured" if settings.SENTINEL_HUB_CLIENT_ID else "not_configured",
            "gemini": "configured" if settings.GEMINI_API_KEY else "not_configured"
        }
    }
