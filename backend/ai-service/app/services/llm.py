# =============================================================================
# app/services/llm.py - Gemini LLM Client
# =============================================================================

import json
import logging
from typing import Any

import google.generativeai as genai

from app.config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)


class GeminiClient:
    """
    Wrapper around Google Gemini API for text and structured JSON generation.
    """

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or GEMINI_API_KEY
        self.model_name = model or GEMINI_MODEL

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required. Set it in .env file.")

        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
        logger.info(f"GeminiClient initialized with model: {self.model_name}")

    def generate(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float = 0.7,
    ) -> str:
        """Generate free-text response from Gemini."""
        model = self.model
        if system_instruction:
            model = genai.GenerativeModel(
                self.model_name,
                system_instruction=system_instruction,
            )

        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                ),
            )
        except Exception as e:
            raise self._handle_api_error(e)

        logger.debug(f"Gemini response length: {len(response.text)} chars")
        return response.text

    def generate_json(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float = 0.3,
        max_retries: int = 2,
    ) -> dict[str, Any]:
        """Generate structured JSON response from Gemini with auto-repair."""
        model = self.model
        if system_instruction:
            model = genai.GenerativeModel(
                self.model_name,
                system_instruction=system_instruction,
            )

        for attempt in range(max_retries + 1):
            try:
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=temperature,
                        response_mime_type="application/json",
                    ),
                )
            except Exception as e:
                raise self._handle_api_error(e)

            raw_text = response.text.strip()
            logger.debug(f"Gemini JSON response (attempt {attempt + 1}): {raw_text[:300]}...")

            # Try parsing directly
            try:
                return json.loads(raw_text)
            except json.JSONDecodeError as e:
                logger.warning(f"JSON parse error (attempt {attempt + 1}): {e}")

                # Try to repair common Gemini JSON issues
                repaired = self._repair_json(raw_text)
                if repaired is not None:
                    logger.info("JSON repaired successfully")
                    return repaired

                # Retry if we have attempts left
                if attempt < max_retries:
                    logger.info(f"Retrying Gemini call (attempt {attempt + 2})...")
                    temperature = max(0.1, temperature - 0.1)
                    continue

                logger.error(f"Failed to parse Gemini JSON after {max_retries + 1} attempts")
                logger.error(f"Raw response: {raw_text}")
                raise ValueError(f"Gemini returned invalid JSON: {e}") from e

    @staticmethod
    def _repair_json(text: str) -> dict | None:
        """Attempt to repair common JSON issues from LLM output."""
        import re

        repaired = text

        # Fix: missing } before , (e.g. "reason": "..." , { → "reason": "..." }, {)
        repaired = re.sub(r'"\s*\n\s*,\s*\n\s*\{', '"\n    },\n    {', repaired)
        repaired = re.sub(r'"\s*,\s*\{', '"},\n    {', repaired)

        # Fix: trailing comma before ] or }
        repaired = re.sub(r',\s*([}\]])', r'\1', repaired)

        # Fix: missing closing braces — count and balance
        open_braces = repaired.count('{') - repaired.count('}')
        open_brackets = repaired.count('[') - repaired.count(']')
        repaired += '}' * max(0, open_braces)
        repaired += ']' * max(0, open_brackets)

        try:
            return json.loads(repaired)
        except json.JSONDecodeError:
            return None

    @staticmethod
    def _handle_api_error(e: Exception) -> Exception:
        """Convert API errors to user-friendly messages."""
        error_str = str(e)

        if "429" in error_str or "quota" in error_str.lower():
            logger.error(f"Gemini quota exceeded: {e}")
            return ValueError(
                "AI service is temporarily unavailable due to usage limits. "
                "Please try again later or upgrade to a Pro plan."
            )
        elif "403" in error_str or "permission" in error_str.lower():
            logger.error(f"Gemini permission error: {e}")
            return ValueError(
                "AI service authentication failed. Please check your API key."
            )
        else:
            logger.error(f"Gemini API error: {e}")
            return ValueError("AI service encountered an error. Please try again.")

