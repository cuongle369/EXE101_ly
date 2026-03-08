# =============================================================================
# app/agent/graph.py - LangGraph Workflow Builder
# =============================================================================
# Builds the clarify → standardize → review → assign pipeline.
# =============================================================================

import logging
from typing import Literal

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph

from app.agent.state import AgentState
from app.agent.nodes import (
    clarify_task,
    standardize_task,
    human_review,
    assign_task,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Routing Functions
# =============================================================================

def route_after_clarify(state: AgentState) -> Literal["standardize_task", "__end__"]:
    """
    Route after clarification:
    - needs_clarification=True → END (return to user for answers)
    - needs_clarification=False → proceed to standardize
    """
    if state.get("needs_clarification", False):
        logger.info("Clarification needed → pausing for user reply")
        return "__end__"
    else:
        logger.info("No clarification needed → standardizing task")
        return "standardize_task"


def route_after_review(
    state: AgentState,
) -> Literal["assign_task", "standardize_task", "__end__"]:
    """
    Route after human review:
    - approve → assign_task
    - edit → standardize_task (re-generate with edits)
    - reject → END (cancel)
    """
    review = state.get("human_review", {})

    if isinstance(review, dict):
        decision = review.get("decision", "approve")
    elif isinstance(review, str):
        decision = review.lower()
    else:
        decision = "approve"

    if decision == "approve":
        logger.info("Task approved → assigning")
        return "assign_task"
    elif decision == "edit":
        logger.info("Task edited → re-standardizing")
        return "standardize_task"
    else:  # reject
        logger.info("Task rejected → cancelling")
        return "__end__"


# =============================================================================
# Graph Builder
# =============================================================================

def build_graph() -> StateGraph:
    """
    Build the LangGraph workflow:

    Flow:
        start → clarify_task
          ├─ needs_clarification=True  → END (user replies, then re-invoke)
          └─ needs_clarification=False → standardize_task → human_review
                                           ├─ approve → assign_task → END
                                           ├─ edit    → standardize_task (loop)
                                           └─ reject  → END
    """
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("clarify_task", clarify_task)
    graph.add_node("standardize_task", standardize_task)
    graph.add_node("review_task", human_review)
    graph.add_node("assign_task", assign_task)

    # Entry point
    graph.set_entry_point("clarify_task")

    # Edges
    graph.add_conditional_edges(
        "clarify_task",
        route_after_clarify,
        {
            "standardize_task": "standardize_task",
            "__end__": END,
        },
    )
    graph.add_edge("standardize_task", "review_task")
    graph.add_conditional_edges(
        "review_task",
        route_after_review,
        {
            "assign_task": "assign_task",
            "standardize_task": "standardize_task",
            "__end__": END,
        },
    )
    graph.add_edge("assign_task", END)

    return graph


def create_workflow():
    """
    Create a compiled workflow with memory checkpointer.

    Usage:
        workflow = create_workflow()
        result = workflow.invoke({
            "raw_input": "Harvest 50 tons of coffee by Oct 30...",
            "group_name": "Harvest Team A",
            "category": "Operations",
            "priority": "medium",
        }, config={"configurable": {"thread_id": "session-1"}})
    """
    graph = build_graph()
    memory = MemorySaver()
    return graph.compile(checkpointer=memory)


__all__ = ["build_graph", "create_workflow"]
