# =============================================================================
# app/agent/nodes/clarify.py - Clarification Node
# =============================================================================
# Checks if the manager's input is missing critical info.
# If yes → generates follow-up questions. If no → proceeds.
# =============================================================================

import logging
from typing import Any

from app.services.llm import GeminiClient
from app.agent.prompts import CLARIFIER_SYSTEM_PROMPT
from app.agent.state import AgentState

logger = logging.getLogger(__name__)

# Singleton LLM client
_llm: GeminiClient | None = None


def _get_llm() -> GeminiClient:
    global _llm
    if _llm is None:
        _llm = GeminiClient()
    return _llm


def clarify_task(state: AgentState) -> dict[str, Any]:
    """
    Analyze manager's input and check for missing information.

    If first time: analyzes raw_input.
    If returning after user reply: analyzes full conversation.
    """
    llm = _get_llm()

    # Build conversation context
    history = state.get("conversation_history", [])

    if not history:
        # First time — initialize with raw input
        raw_input = state.get("raw_input", "")
        history = [{"role": "user", "content": raw_input}]

    # Build prompt with full conversation
    conversation_text = "\n".join(
        f"{'Manager' if msg['role'] == 'user' else 'AI'}: {msg['content']}"
        for msg in history
    )

    # Add group metadata if available
    metadata_parts = []
    if state.get("group_name"):
        metadata_parts.append(f"Group Name: {state['group_name']}")
    if state.get("category"):
        metadata_parts.append(f"Category: {state['category']}")
    if state.get("priority"):
        metadata_parts.append(f"Priority: {state['priority']}")

    metadata_text = "\n".join(metadata_parts)

    prompt = f"""Analyze this task request from a manager:

## Group Metadata
{metadata_text if metadata_text else "Not provided"}

## Conversation
{conversation_text}

Determine if critical information is missing and respond accordingly.
"""

    logger.info("Clarify node: analyzing task input...")
    result = llm.generate_json(
        prompt=prompt,
        system_instruction=CLARIFIER_SYSTEM_PROMPT,
        temperature=0.3,
    )

    needs_clarification = result.get("needs_clarification", False)
    logger.info(f"Clarify result: needs_clarification={needs_clarification}")

    # Build response
    update: dict[str, Any] = {
        "conversation_history": history,
        "needs_clarification": needs_clarification,
        "missing_info": result.get("missing_info", []),
        "clarification_questions": result.get("clarification_questions", ""),
    }

    # If agent has questions, add them to conversation history
    if needs_clarification and result.get("clarification_questions"):
        update["conversation_history"] = history + [
            {"role": "assistant", "content": result["clarification_questions"]}
        ]

    return update
