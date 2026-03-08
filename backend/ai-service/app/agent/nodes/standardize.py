# =============================================================================
# app/agent/nodes/standardize.py - Task Standardization Node
# =============================================================================
# Takes the clarified info and generates a clean, structured task.
# =============================================================================

import logging
from datetime import datetime
from typing import Any

from app.services.llm import GeminiClient
from app.agent.prompts import STANDARDIZER_SYSTEM_PROMPT
from app.agent.state import AgentState

logger = logging.getLogger(__name__)

_llm: GeminiClient | None = None


def _get_llm() -> GeminiClient:
    global _llm
    if _llm is None:
        _llm = GeminiClient()
    return _llm


def standardize_task(state: AgentState) -> dict[str, Any]:
    """
    Generate a standardized task from the gathered information.
    """
    llm = _get_llm()

    # Build full context
    history = state.get("conversation_history", [])
    conversation_text = "\n".join(
        f"{'Manager' if msg['role'] == 'user' else 'AI'}: {msg['content']}"
        for msg in history
    )

    group_name = state.get("group_name", "")
    category = state.get("category", "")
    priority = state.get("priority", "medium")

    prompt = f"""Create a standardized task from the following information:

## Group Metadata
- Group Name: {group_name or 'Not specified'}
- Category: {category or 'Not specified'}
- Priority Level: {priority}
- Current Date: {datetime.now().strftime('%Y-%m-%d')}

## Full Conversation
{conversation_text}

Generate a professional, standardized task description.
"""

    logger.info("Standardize node: generating structured task...")
    result = llm.generate_json(
        prompt=prompt,
        system_instruction=STANDARDIZER_SYSTEM_PROMPT,
        temperature=0.3,
    )

    # Validate and clean output
    standardized = {
        "task_title": result.get("task_title", "Untitled Task"),
        "description_points": result.get("description_points", []),
        "deadline": result.get("deadline"),
        "priority": result.get("priority", priority).lower(),
        "required_skills": [
            s.lower().strip() for s in result.get("required_skills", []) if s
        ],
        "estimated_effort_hours": result.get("estimated_effort_hours", 8),
        "subtasks": [
            str(s).strip() for s in result.get("subtasks", []) if s
        ],
    }

    # Fallback: if LLM returns "description" string instead of points
    if not standardized["description_points"] and result.get("description"):
        standardized["description_points"] = [result["description"]]

    # Normalize priority
    if standardized["priority"] not in ("low", "medium", "high"):
        standardized["priority"] = "medium"

    logger.info(f"Standardized task: {standardized['task_title']}")

    return {"standardized_task": standardized}
