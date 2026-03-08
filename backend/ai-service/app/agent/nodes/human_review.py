# =============================================================================
# app/agent/nodes/human_review.py - Human Review Node
# =============================================================================
# Pauses the workflow for human approval using LangGraph interrupt().
# =============================================================================

import logging
from typing import Any

from langgraph.types import interrupt

from app.agent.state import AgentState

logger = logging.getLogger(__name__)


def human_review(state: AgentState) -> dict[str, Any]:
    """
    Interrupt workflow and wait for human approval.

    The standardized task is presented to the manager for review.
    Manager can: approve, reject, or edit.
    """
    standardized = state.get("standardized_task", {})

    logger.info(f"Human review: waiting for approval of '{standardized.get('task_title', '')}'")

    # Interrupt and wait for human input
    review_decision = interrupt(
        {
            "type": "review_task",
            "message": "Please review the standardized task below.",
            "standardized_task": standardized,
            "options": ["approve", "reject", "edit"],
        }
    )

    logger.info(f"Human review decision: {review_decision}")

    return {"human_review": review_decision}
