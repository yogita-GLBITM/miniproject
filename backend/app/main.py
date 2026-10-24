from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, check_db_connection, Base
from app.api.v1 import api_v1_router
from app.services.gemini_service import GeminiService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    try:
        Base.metadata.create_all(bind=engine)
        # Auto-seed if database is empty
        from app.db.seed import seed_database
        from app.db.session import SessionLocal
        with SessionLocal() as db:
            seed_database(db)
    except Exception as e:
        print(f"Startup warning / DB check: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="GL Bajaj CampusOS Academic ERP & AI Intelligence Backend",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS configuration
origins = settings.cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.services.supabase_service import SupabaseService


# Health endpoint
@app.get("/health", tags=["Health & Readiness"])
def health_check():
    """Verify system health, database readiness, Supabase connectivity, and Gemini AI status."""
    db_connected = check_db_connection()
    gemini_ready = GeminiService.is_configured()
    supabase_status = SupabaseService.check_connection()

    system_status = "healthy" if db_connected else "degraded"

    return {
        "status": system_status,
        "database": {
            "connected": db_connected,
            "engine": "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql",
        },
        "supabase": supabase_status,
        "gemini": {
            "configured": gemini_ready,
            "model": settings.GEMINI_MODEL,
            "status": "ready" if gemini_ready else "api_key_missing",
            "message": "Live Google Gemini AI active" if gemini_ready else "Set GEMINI_API_KEY in backend/.env for dynamic model inference",
        },
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
    }


# Include V1 API Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "GL Bajaj CampusOS Backend is running.",
        "documentation": f"{settings.API_V1_STR}/docs",
        "health": "/health",
    }
