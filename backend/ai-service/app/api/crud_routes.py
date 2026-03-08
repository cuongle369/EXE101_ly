# =============================================================================
# app/api/crud_routes.py - CRUD API Endpoints (Groups, Tasks, Assignments)
# =============================================================================

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Assignment, Group, Member, Task, generate_invite_code
from app.crud_schemas import (
    AssignmentProgressUpdate,
    AssignmentResponse,
    AssignmentStatusUpdate,
    DashboardStats,
    DistributionItem,
    GroupCreate,
    GroupJoin,
    GroupResponse,
    MemberCreate,
    MemberPerformance,
    MemberResponse,
    MyTaskItem,
    TaskCreate,
    TaskCreateWithDistribution,
    TaskResponse,
    TaskStatusUpdate,
    TaskUpdate,
)

logger = logging.getLogger(__name__)

crud_router = APIRouter(prefix="/api", tags=["CRUD"])


# =============================================================================
# Helper
# =============================================================================

def _build_task_response(task: Task) -> TaskResponse:
    assignments = []
    for a in task.assignments:
        assignments.append(
            AssignmentResponse(
                id=a.id,
                member_id=a.member_id,
                member_name=a.member.name if a.member else "",
                assigned_amount=a.assigned_amount,
                status=a.status,
                progress=a.progress or 0,
            )
        )
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        quantity=task.quantity,
        quantity_number=task.quantity_number,
        unit=task.unit,
        deadline=task.deadline,
        priority=task.priority,
        status=task.status,
        group_id=task.group_id,
        created_at=task.created_at,
        assignments=assignments,
    )


def _distribute_workload(members, quantity_number, unit):
    if not members:
        return []
    unit_str = unit or ""
    results = []
    for member in members:
        if quantity_number is not None and len(members) > 0:
            per_person = quantity_number / len(members)
            rounded = round(per_person, 2)
            if rounded == int(rounded):
                amount_str = f"{int(rounded)} {unit_str}".strip()
            else:
                amount_str = f"{rounded} {unit_str}".strip()
        else:
            amount_str = "Phan viec duoc giao"
        results.append({
            "member_id": member.id,
            "member_name": member.name,
            "assigned_amount": amount_str,
        })
    return results


# =============================================================================
# Group Routes
# =============================================================================

@crud_router.post("/groups", response_model=GroupResponse, status_code=201)
def create_group(data: GroupCreate, db: Session = Depends(get_db)):
    group = Group(name=data.name, invite_code=generate_invite_code())
    db.add(group)
    db.commit()
    db.refresh(group)
    return GroupResponse(
        id=group.id, name=group.name, invite_code=group.invite_code,
        created_at=group.created_at, member_count=0, task_count=0,
    )


@crud_router.get("/groups/{group_id}", response_model=GroupResponse)
def get_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Khong tim thay nhom")
    return GroupResponse(
        id=group.id, name=group.name, invite_code=group.invite_code,
        created_at=group.created_at,
        member_count=len(group.members), task_count=len(group.tasks),
    )


@crud_router.post("/groups/join", response_model=GroupResponse)
def join_group(data: GroupJoin, db: Session = Depends(get_db)):
    group = db.query(Group).filter(
        Group.invite_code == data.invite_code.upper()
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Ma moi khong hop le")
    return GroupResponse(
        id=group.id, name=group.name, invite_code=group.invite_code,
        created_at=group.created_at,
        member_count=len(group.members), task_count=len(group.tasks),
    )


# =============================================================================
# Member Routes
# =============================================================================

@crud_router.get("/groups/{group_id}/members", response_model=list[MemberResponse])
def list_members(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Khong tim thay nhom")
    return group.members


@crud_router.post("/groups/{group_id}/members", response_model=MemberResponse, status_code=201)
def add_member(group_id: int, data: MemberCreate, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Khong tim thay nhom")
    existing = db.query(Member).filter(
        Member.group_id == group_id, Member.name == data.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Thanh vien da ton tai trong nhom")
    member = Member(name=data.name, role=data.role, group_id=group_id)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


# =============================================================================
# Task Routes
# =============================================================================

@crud_router.get("/groups/{group_id}/tasks", response_model=list[TaskResponse])
def list_tasks(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Khong tim thay nhom")
    tasks = db.query(Task).filter(
        Task.group_id == group_id
    ).order_by(Task.created_at.desc()).all()
    return [_build_task_response(t) for t in tasks]


@crud_router.post(
    "/groups/{group_id}/tasks",
    response_model=TaskCreateWithDistribution,
    status_code=201,
)
def create_task(group_id: int, data: TaskCreate, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Khong tim thay nhom")

    task = Task(
        title=data.title, description=data.description,
        quantity=data.quantity, quantity_number=data.quantity_number,
        unit=data.unit, deadline=data.deadline,
        priority=data.priority, group_id=group_id,
    )
    db.add(task)
    db.flush()

    members = group.members
    dist_results = _distribute_workload(members, data.quantity_number, data.unit)
    distribution_items = []
    for dist in dist_results:
        assignment = Assignment(
            task_id=task.id,
            member_id=dist["member_id"],
            assigned_amount=dist["assigned_amount"],
        )
        db.add(assignment)
        distribution_items.append(DistributionItem(**dist))

    db.commit()
    db.refresh(task)
    return TaskCreateWithDistribution(
        task=_build_task_response(task),
        distribution=distribution_items,
    )


@crud_router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Khong tim thay task")
    return _build_task_response(task)


@crud_router.patch("/tasks/{task_id}/status", response_model=TaskResponse)
def update_task_status(task_id: int, data: TaskStatusUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Khong tim thay task")
    task.status = data.status
    db.commit()
    db.refresh(task)
    return _build_task_response(task)


@crud_router.api_route("/tasks/{task_id}", methods=["PATCH", "PUT"], response_model=TaskResponse)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Khong tim thay task")

    update_data = data.model_dump(exclude_unset=True)
    member_ids = update_data.pop("member_ids", None)

    for field, value in update_data.items():
        if value is not None:
            setattr(task, field, value)

    if member_ids is not None:
        current = {a.member_id: a for a in task.assignments}
        new_ids = set(member_ids)
        for mid, a in current.items():
            if mid not in new_ids:
                db.delete(a)
        for mid in new_ids:
            if mid not in current:
                db.add(Assignment(
                    task_id=task.id, member_id=mid,
                    assigned_amount="Phan viec duoc giao", status="pending",
                ))
        db.commit()
        db.refresh(task)

        if task.quantity_number and len(task.assignments) > 0:
            per = round(task.quantity_number / len(task.assignments), 2)
            unit_str = task.unit or ""
            amt = f"{int(per) if per == int(per) else per} {unit_str}".strip()
            for a in task.assignments:
                a.assigned_amount = amt
            db.commit()

    db.commit()
    db.refresh(task)
    return _build_task_response(task)


@crud_router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Khong tim thay task")
    db.delete(task)
    db.commit()


# =============================================================================
# Assignment Routes
# =============================================================================

@crud_router.patch("/assignments/{assignment_id}/status", response_model=AssignmentResponse)
def update_assignment_status(
    assignment_id: int,
    data: AssignmentStatusUpdate,
    db: Session = Depends(get_db),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Khong tim thay phan viec")

    assignment.status = data.status
    if data.status == "done":
        assignment.progress = 100
    assignment.updated_at = datetime.now(timezone.utc)
    db.commit()

    _sync_task_status(assignment.task, db)
    db.refresh(assignment)

    return AssignmentResponse(
        id=assignment.id, member_id=assignment.member_id,
        member_name=assignment.member.name if assignment.member else "",
        assigned_amount=assignment.assigned_amount,
        status=assignment.status, progress=assignment.progress or 0,
    )


@crud_router.patch("/assignments/{assignment_id}/progress", response_model=AssignmentResponse)
def update_assignment_progress(
    assignment_id: int,
    data: AssignmentProgressUpdate,
    db: Session = Depends(get_db),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Khong tim thay phan viec")

    assignment.progress = data.progress
    assignment.updated_at = datetime.now(timezone.utc)

    # Auto-done at 100%
    if data.progress >= 100:
        assignment.status = "done"
        assignment.progress = 100
    elif data.progress > 0:
        assignment.status = "progress"

    db.commit()
    _sync_task_status(assignment.task, db)
    db.refresh(assignment)

    return AssignmentResponse(
        id=assignment.id, member_id=assignment.member_id,
        member_name=assignment.member.name if assignment.member else "",
        assigned_amount=assignment.assigned_amount,
        status=assignment.status, progress=assignment.progress or 0,
    )


def _sync_task_status(task, db):
    """Auto-update parent task status based on assignment statuses."""
    if task and task.assignments:
        all_a = task.assignments
        done_count = sum(1 for a in all_a if a.status == "done")
        prog_count = sum(1 for a in all_a if a.status == "progress")
        if done_count == len(all_a):
            task.status = "done"
        elif done_count > 0 or prog_count > 0:
            task.status = "progress"
        else:
            task.status = "pending"
        db.commit()


# =============================================================================
# Dashboard (Manager View)
# =============================================================================

@crud_router.get("/groups/{group_id}/dashboard", response_model=DashboardStats)
def get_dashboard(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Khong tim thay nhom")

    tasks = db.query(Task).filter(Task.group_id == group_id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == "done")
    in_progress = sum(1 for t in tasks if t.status == "progress")
    pending = sum(1 for t in tasks if t.status == "pending")

    all_assignments = [a for t in tasks for a in t.assignments]
    if all_assignments:
        done_a = sum(1 for a in all_assignments if a.status == "done")
        completion_pct = (done_a / len(all_assignments)) * 100
    else:
        completion_pct = (completed / total * 100) if total > 0 else 0.0

    member_perfs = []
    for member in group.members:
        total_a = len(member.assignments)
        done_a = sum(1 for a in member.assignments if a.status == "done")
        perf = (done_a / total_a * 100) if total_a > 0 else 0.0
        member_perfs.append(MemberPerformance(
            id=member.id, name=member.name, role=member.role,
            completed_assignments=done_a, total_assignments=total_a,
            performance_percent=round(perf, 1),
        ))

    return DashboardStats(
        group_name=group.name, invite_code=group.invite_code,
        total_tasks=total, in_progress=in_progress,
        completed=completed, pending=pending,
        completion_percent=round(completion_pct, 1),
        members=member_perfs,
        tasks=[_build_task_response(t) for t in tasks],
    )


# =============================================================================
# My Tasks (Employee View)
# =============================================================================

@crud_router.get(
    "/groups/{group_id}/members/{member_id}/tasks",
    response_model=list[MyTaskItem],
)
def get_member_tasks(group_id: int, member_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(
        Member.id == member_id, Member.group_id == group_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Khong tim thay thanh vien")

    items = []
    for assignment in member.assignments:
        task = assignment.task
        items.append(MyTaskItem(
            assignment_id=assignment.id,
            task_id=task.id,
            task_title=task.title,
            task_description=task.description,
            assigned_amount=assignment.assigned_amount,
            assignment_status=assignment.status,
            task_status=task.status,
            deadline=task.deadline,
            priority=task.priority,
            progress=assignment.progress or 0,
        ))
    return items
