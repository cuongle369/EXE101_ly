# =============================================================================
# app/main.py - FastAPI Application Entry Point
# =============================================================================

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS, HOST, PORT, validate_config
from app.api.routes import router
from app.api.crud_routes import crud_router
from app.database import Base, engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-30s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    # Validate config
    errors = validate_config()
    if errors:
        for err in errors:
            logger.warning(f"Config warning: {err}")

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")

    app = FastAPI(
        title="Cafe Workshop Manager",
        description="He thong quan ly xuong cafe voi AI.",
        version="1.0.0",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routes
    app.include_router(router)
    app.include_router(crud_router)

    @app.get("/health")
    async def health():
        return {"status": "ok", "service": "cafe-workshop-manager"}

    logger.info("Cafe Workshop Manager service initialized")
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
