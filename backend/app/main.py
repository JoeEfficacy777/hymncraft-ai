from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.endpoints.harmonize import router as harmonize_router
from app.whatsapp.bot import router as whatsapp_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=\"AI-powered Hymn Harmonizer and Choir Assistant with 7 distinct harmony types.\"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[\"*\"],
    allow_credentials=True,
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)

# Static file serving for generated audio files and PDFs
app.mount(\"/storage\", StaticFiles(directory=str(settings.STORAGE_DIR)), name=\"storage\")

# Include Routers
app.include_router(harmonize_router, prefix=settings.API_V1_STR, tags=[\"harmonize\"])
app.include_router(whatsapp_router, prefix=\"/api/v1\", tags=[\"whatsapp\"])


@app.get(\"/\")
def root():
    return {
        \"project\": settings.PROJECT_NAME,
        \"version\": settings.VERSION,
        \"status\": \"online\",
        \"docs\": \"/docs\"
    }


@app.get(\"/health\")
def health_check():
    return {\"status\": \"healthy\"}
