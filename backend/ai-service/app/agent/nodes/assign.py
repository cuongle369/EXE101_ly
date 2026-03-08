# =============================================================================
# app/agent/nodes/assign.py - Workload Assignment Node
# =============================================================================
# Uses AI to match task to team members and distribute workload.
# =============================================================================

import logging
from typing import Any

from app.services.llm import GeminiClient
from app.services.member_service import get_member_service
from app.agent.prompts import ASSIGNER_SYSTEM_PROMPT
from app.agent.state import AgentState

logger = logging.getLogger(__name__)

_llm: GeminiClient | None = None


def _get_llm() -> GeminiClient:
    global _llm
    if _llm is None:
        _llm = GeminiClient()
    return _llm


def assign_task(state: AgentState) -> dict[str, Any]:
    """
    Fetch members and use AI to distribute workload.
    """
    llm = _get_llm()
    member_service = get_member_service()

    # Fetch members (sync call)
    members = member_service.get_members()

    standardized = state.get("standardized_task", {})

    # Build prompt
    members_text = "\n".join(
        f"- {m['name']} (ID: {m['id']}, Role: {m['role']}, "
        f"Skills: {', '.join(m['skills'])}, Level: {m['level']}, "
        f"Current Workload: {m['current_workload']}%)"
        for m in members
    )

    prompt = f"""Assign this task to the most suitable team members:

## Task
- Title: {standardized.get('task_title', '')}
- Description: {standardized.get('description', '')}
- Required Skills: {', '.join(standardized.get('required_skills', []))}
- Priority: {standardized.get('priority', 'medium')}
- Estimated Effort: {standardized.get('estimated_effort_hours', 8)} hours

## Available Team Members
{members_text}

Distribute the workload fairly among the best-matched members.
"""

    logger.info("Assign node: generating workload distribution...")
    result = llm.generate_json(
        prompt=prompt,
        system_instruction=ASSIGNER_SYSTEM_PROMPT,
        temperature=0.3,
    )

    assignments = result.get("assignments", [])
    logger.info(f"Generated {len(assignments)} assignments")

    return {
        "members": members,
        "assignments": assignments,
        "final_status": "done",
    }
