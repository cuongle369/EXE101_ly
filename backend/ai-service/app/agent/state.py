# =============================================================================
# app/agent/state.py - LangGraph Workflow State
# =============================================================================

from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    """
    State shared across all nodes in the AI Task Agent workflow.

    Fields:
        --- Input ---
        raw_input: str              Manager's original chat message
        group_name: str             Task group name
        category: str               Operations / Development / etc.
        priority: str               Low / Medium / High

        --- Clarification Loop ---
        conversation_history: list  Chat history [{role, content}]
        missing_info: list          Agent-detected missing fields
        clarification_questions: str  Natural language questions to ask
        needs_clarification: bool   Whether more info is needed

        --- Standardization ---
        standardized_task: dict     Clean structured task output

        --- Human Review ---
        human_review: dict          {decision: approve|reject|edit, edits: {}}

        --- Assignment ---
        members: list               Available team members
        assignments: list           AI workload distribution

        --- Meta ---
        final_status: str           done / cancelled
        error: str                  Error message if any
    """

    # Input
    raw_input: str
    group_name: str
    category: str
    priority: str

    # Clarification
    conversation_history: list[dict[str, str]]
    missing_info: list[str]
    clarification_questions: str
    needs_clarification: bool

    # Standardization
    standardized_task: dict[str, Any]

    # Human Review
    human_review: dict[str, Any]

    # Assignment
    members: list[dict[str, Any]]
    assignments: list[dict[str, Any]]

    # Meta
    final_status: str
    error: str


__all__ = ["AgentState"]
