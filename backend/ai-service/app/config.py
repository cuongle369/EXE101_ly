# =============================================================================
# app/config.py - AI Service Configuration
# =============================================================================
# Centralized configuration loaded from environment variables.
# =============================================================================

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from ai-service root
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


# =============================================================================
# Gemini LLM Settings
# =============================================================================

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


# =============================================================================
# LangSmith Tracing
# =============================================================================

LANGCHAIN_TRACING_V2: str = os.getenv("LANGCHAIN_TRACING_V2", "true")
LANGCHAIN_API_KEY: str = os.getenv("LANGCHAIN_API_KEY", "")
LANGCHAIN_PROJECT: str = os.getenv("LANGCHAIN_PROJECT", "ai-task-agent")

# Set env vars for LangSmith auto-detection
os.environ["LANGCHAIN_TRACING_V2"] = LANGCHAIN_TRACING_V2
if LANGCHAIN_API_KEY:
    os.environ["LANGCHAIN_API_KEY"] = LANGCHAIN_API_KEY
os.environ["LANGCHAIN_PROJECT"] = LANGCHAIN_PROJECT


# =============================================================================
# SE Backend Settings (for production integration)
# =============================================================================

SE_BACKEND_URL: str = os.getenv("SE_BACKEND_URL", "")
SE_API_PREFIX: str = os.getenv("SE_API_PREFIX", "/api/v1")

# If SE_BACKEND_URL is empty → use mock data
USE_MOCK_DATA: bool = not bool(SE_BACKEND_URL)


# =============================================================================
# Server Settings
# =============================================================================

HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8000"))
CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
).split(",")


# =============================================================================
# Validation
# =============================================================================

def validate_config() -> list[str]:
    """Validate that required configuration is set. Returns list of errors."""
    errors = []
    if not GEMINI_API_KEY:
        errors.append("GEMINI_API_KEY is not set")
    if LANGCHAIN_TRACING_V2 == "true" and not LANGCHAIN_API_KEY:
        errors.append("LANGCHAIN_API_KEY is not set (required when tracing is enabled)")
    return errors
