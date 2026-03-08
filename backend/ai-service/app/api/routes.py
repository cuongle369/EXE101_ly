# =============================================================================
# app/api/routes.py - API Endpoints
# =============================================================================

import logging
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from langgraph.types import Command

from app.agent.graph import create_workflow
from app.api.schemas import (
    ChatStartRequest,
    ChatMessageRequest,
    ChatResponse,
    MembersListResponse,
    ReviewRequest,
)
from app.services.member_service import get_member_service
from app.database import SessionLocal
from app.models import Task, Assignment, Member, Group

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

# Global workflow instance (with memory checkpointer)
workflow = create_workflow()


# =============================================================================
# Chat Endpoints
# =============================================================================

@router.post("/chat/start", response_model=ChatResponse)
async def start_chat(request: ChatStartRequest):
    """
    Start a new task workflow session.

    The manager provides their task description, and the AI agent
    will either ask clarification questions or proceed to standardize.
    """
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    initial_state = {
        "raw_input": request.raw_input,
        "group_name": request.group_name,
        "category": request.category,
        "priority": request.priority,
    }

    logger.info(f"Starting new chat session: {thread_id}")

    try:
        result = workflow.invoke(initial_state, config=config)
    except Exception as e:
        logger.error(f"Workflow error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return _build_response(thread_id, result)


@router.post("/chat/{thread_id}/message", response_model=ChatResponse)
async def send_message(thread_id: str, request: ChatMessageRequest):
    """
    Send a clarification reply to an existing session.

    After receiving clarification questions, the manager sends their answers.
    The agent will re-analyze and either ask more questions or proceed.
    """
    config = {"configurable": {"thread_id": thread_id}}

    # Get current state
    state = workflow.get_state(config)
    if not state or not state.values:
        raise HTTPException(status_code=404, detail="Session not found")

    current_state = state.values

    # Add user reply to conversation history
    history = current_state.get("conversation_history", [])
    history.append({"role": "user", "content": request.message})

    # Re-invoke the workflow with updated conversation
    updated_state = {
        **current_state,
        "conversation_history": history,
        "needs_clarification": False,  # Reset for re-analysis
    }

    logger.info(f"Continuing session {thread_id} with user reply")

    try:
        result = workflow.invoke(updated_state, config=config)
    except Exception as e:
        logger.error(f"Workflow error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return _build_response(thread_id, result)


@router.get("/chat/{thread_id}/state", response_model=ChatResponse)
async def get_state(thread_id: str):
    """Get the current workflow state for a session."""
    config = {"configurable": {"thread_id": thread_id}}

    state = workflow.get_state(config)
    if not state or not state.values:
        raise HTTPException(status_code=404, detail="Session not found")

    return _build_response(thread_id, state.values)


@router.post("/chat/{thread_id}/review", response_model=ChatResponse)
async def submit_review(thread_id: str, request: ReviewRequest):
    """
    Submit review decision for a standardized task.

    After seeing the task preview, manager can approve, reject, or edit.
    When approved, the task and assignments are saved to the database.
    """
    config = {"configurable": {"thread_id": thread_id}}

    state = workflow.get_state(config)
    if not state or not state.values:
        raise HTTPException(status_code=404, detail="Session not found")

    # Idempotency: prevent double-clicks from saving duplicate tasks to DB
    if state.values.get("final_status") == "done":
        logger.info(f"Thread {thread_id} already approved and saved. Skipping duplicate request.")
        return _build_response(thread_id, state.values)

    review_data = {
        "decision": request.decision,
        "edits": request.edits,
    }

    logger.info(f"Review for {thread_id}: {request.decision}")

    try:
        # Resume the workflow after human_review interrupt
        result = workflow.invoke(
            Command(resume=review_data),
            config=config,
        )
    except Exception as e:
        logger.error(f"Review workflow error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # --- Save approved task to database ---
    if result.get("final_status") == "done":
        try:
            _save_to_database(result)
        except Exception as e:
            logger.error(f"Database save error: {e}")
            # Don't fail the whole request — task was approved, just log the error

    return _build_response(thread_id, result)


# =============================================================================
# Member Endpoints
# =============================================================================

@router.get("/members", response_model=MembersListResponse)
async def list_members():
    """List available team members (mock data for MVP)."""
    service = get_member_service()
    members = await service.get_members()
    return MembersListResponse(members=members)


# =============================================================================
# Helpers
# =============================================================================

def _save_to_database(state: dict[str, Any]) -> None:
    """
    Save an approved task + assignments to the SQLite database.
    This bridges the AI chat flow with the CRUD employee dashboard.
    """
    standardized = state.get("standardized_task", {})
    ai_assignments = state.get("assignments", [])
    group_name = state.get("group_name", "")

    if not standardized:
        logger.warning("No standardized task to save")
        return

    db = SessionLocal()
    try:
        # Find or create the group
        group = None
        if group_name:
            group = db.query(Group).filter(Group.name == group_name).first()

        if not group:
            # Fallback: use the first group, or create one
            group = db.query(Group).first()
            if not group:
                from app.models import generate_invite_code
                group = Group(name=group_name or "Default", invite_code=generate_invite_code())
                db.add(group)
                db.flush()

        # Create the task
        task = Task(
            title=standardized.get("task_title", "Untitled"),
            description=standardized.get("description", ""),
            quantity=standardized.get("quantity", ""),
            deadline=standardized.get("deadline", ""),
            priority=standardized.get("priority", state.get("priority", "medium")),
            group_id=group.id,
        )
        db.add(task)
        db.flush()

        # Create assignments — one per REAL member in the group (not per AI mock)
        members_in_group = db.query(Member).filter(Member.group_id == group.id).all()

        if members_in_group:
            # Distribute evenly among real members
            per_member = round(100 / len(members_in_group), 1) if members_in_group else 0
            for member in members_in_group:
                assignment = Assignment(
                    task_id=task.id,
                    member_id=member.id,
                    assigned_amount=f"Phan cong: {per_member}%",
                    status="pending",
                )
                db.add(assignment)

        db.commit()
        logger.info(f"Saved task '{task.title}' (id={task.id}) with {len(members_in_group)} assignments to group '{group.name}'")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def _build_response(thread_id: str, state: dict[str, Any]) -> ChatResponse:
    """Build a ChatResponse from workflow state."""
    needs_clarification = state.get("needs_clarification", False)
    standardized = state.get("standardized_task")
    assignments = state.get("assignments")
    final_status = state.get("final_status")

    if final_status == "done" and assignments:
        status = "assigned"
    elif standardized and not needs_clarification:
        status = "standardized"
    elif needs_clarification:
        status = "clarifying"
    else:
        status = "processing"

    return ChatResponse(
        thread_id=thread_id,
        status=status,
        needs_clarification=needs_clarification,
        clarification_questions=state.get("clarification_questions"),
        standardized_task=standardized,
        assignments=assignments,
        members=state.get("members"),
    )

