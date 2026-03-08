# =============================================================================
# app/crud_schemas.py - Pydantic Schemas for CRUD APIs
# =============================================================================

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ====== Group ======

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class GroupJoin(BaseModel):
    invite_code: str = Field(..., min_length=6, max_length=6)


class GroupResponse(BaseModel):
    id: int
    name: str
    invite_code: str
    created_at: datetime
    member_count: int = 0
    task_count: int = 0

    model_config = {"from_attributes": True}


# ====== Member ======

class MemberCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(default="member", pattern="^(leader|member)$")


class MemberResponse(BaseModel):
    id: int
    name: str
    role: str
    group_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ====== Assignment ======

class AssignmentResponse(BaseModel):
    id: int
    member_id: int
    member_name: str = ""
    assigned_amount: str
    status: str = "pending"
    progress: int = 0

    model_config = {"from_attributes": True}


class AssignmentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|progress|done)$")


class AssignmentProgressUpdate(BaseModel):
    progress: int = Field(..., ge=0, le=100)


# ====== Task ======

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    quantity: Optional[str] = None
    quantity_number: Optional[float] = None
    unit: Optional[str] = None
    deadline: Optional[str] = None
    priority: str = Field(default="medium", pattern="^(high|medium|low)$")


class TaskStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|progress|done)$")


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(high|medium|low)$")
    member_ids: Optional[list[int]] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    quantity: Optional[str] = None
    quantity_number: Optional[float] = None
    unit: Optional[str] = None
    deadline: Optional[str] = None
    priority: str = "medium"
    status: str
    group_id: int
    created_at: datetime
    assignments: list[AssignmentResponse] = []

    model_config = {"from_attributes": True}


# ====== Distribution ======

class DistributionItem(BaseModel):
    member_id: int
    member_name: str
    assigned_amount: str


class TaskCreateWithDistribution(BaseModel):
    task: TaskResponse
    distribution: list[DistributionItem]


# ====== Dashboard ======

class MemberPerformance(BaseModel):
    id: int
    name: str
    role: str
    completed_assignments: int = 0
    total_assignments: int = 0
    performance_percent: float = 0.0


class DashboardStats(BaseModel):
    group_name: str
    invite_code: str
    total_tasks: int
    in_progress: int
    completed: int
    pending: int
    completion_percent: float
    members: list[MemberPerformance]
    tasks: list[TaskResponse]


# ====== Employee View ======

class MyTaskItem(BaseModel):
    assignment_id: int
    task_id: int
    task_title: str
    task_description: Optional[str] = None
    assigned_amount: str
    assignment_status: str
    task_status: str
    deadline: Optional[str] = None
    priority: str = "medium"
    progress: int = 0
