# =============================================================================
# app/api/schemas.py - Pydantic Request/Response Models
# =============================================================================

from typing import Any, Optional
from pydantic import BaseModel, Field


# =============================================================================
# Chat Endpoints
# =============================================================================

class ChatStartRequest(BaseModel):
    """Start a new task workflow session."""
    raw_input: str = Field(..., description="Manager's task description")
    group_name: str = Field(default="", description="Task group name")
    category: str = Field(default="Operations", description="Category")
    priority: str = Field(default="medium", description="Priority: low/medium/high")


class ChatMessageRequest(BaseModel):
    """Send a message (clarification reply) to an existing session."""
    message: str = Field(..., description="User's reply to clarification questions")


class ReviewRequest(BaseModel):
    """Submit review decision."""
    decision: str = Field(..., description="approve / reject / edit")
    edits: Optional[dict[str, Any]] = Field(
        default=None,
        description="If decision=edit, the fields to change",
    )


# =============================================================================
# Responses
# =============================================================================

class ChatResponse(BaseModel):
    """Response from chat endpoints."""
    thread_id: str
    status: str = Field(description="clarifying / standardized / approved / assigned / cancelled")
    needs_clarification: bool = False
    clarification_questions: Optional[str] = None
    standardized_task: Optional[dict[str, Any]] = None
    assignments: Optional[list[dict[str, Any]]] = None
    members: Optional[list[dict[str, Any]]] = None


class MemberResponse(BaseModel):
    """Single member."""
    id: str
    name: str
    role: str
    skills: list[str]
    level: str
    avatar_url: Optional[str] = None
    current_workload: int


class MembersListResponse(BaseModel):
    """List of members."""
    members: list[MemberResponse]
