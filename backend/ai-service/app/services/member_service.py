# =============================================================================
# app/services/member_service.py - Member Data Service
# =============================================================================
# MVP: Mock data. Production: swap to SEBackendService.
# =============================================================================

import logging
from abc import ABC, abstractmethod
from typing import Any

import httpx

from app.config import SE_BACKEND_URL, SE_API_PREFIX

logger = logging.getLogger(__name__)


# =============================================================================
# Interface
# =============================================================================

class MemberServiceInterface(ABC):
    """Abstract interface for member data operations."""

    @abstractmethod
    def get_members(self, workspace_id: str = "default") -> list[dict[str, Any]]:
        """Get all members in a workspace."""
        ...

    @abstractmethod
    def create_task(self, task: dict[str, Any]) -> dict[str, Any]:
        """Create a task in the backend."""
        ...

    @abstractmethod
    def assign_task(
        self, task_id: str, assignments: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Assign members to a task."""
        ...


# =============================================================================
# Mock Implementation (MVP)
# =============================================================================

MOCK_MEMBERS = [
    {
        "id": "m-001",
        "name": "Sarah Jenkins",
        "role": "Logistics Lead",
        "skills": ["logistics", "planning", "team-management", "inventory"],
        "level": "senior",
        "avatar_url": None,
        "current_workload": 35,  # percentage
    },
    {
        "id": "m-002",
        "name": "Marcus Chen",
        "role": "Driver A",
        "skills": ["driving", "heavy-equipment", "loading", "safety"],
        "level": "middle",
        "avatar_url": None,
        "current_workload": 30,
    },
    {
        "id": "m-003",
        "name": "Elena Rodriguez",
        "role": "Driver B",
        "skills": ["driving", "navigation", "hauling", "support"],
        "level": "middle",
        "avatar_url": None,
        "current_workload": 30,
    },
    {
        "id": "m-004",
        "name": "David Kim",
        "role": "Inventory Specialist",
        "skills": ["inventory", "verification", "documentation", "quality-check"],
        "level": "junior",
        "avatar_url": None,
        "current_workload": 55,
    },
    {
        "id": "m-005",
        "name": "Priya Patel",
        "role": "Safety Officer",
        "skills": ["safety", "compliance", "inspection", "training"],
        "level": "middle",
        "avatar_url": None,
        "current_workload": 10,
    },
]


class MockMemberService(MemberServiceInterface):
    """MVP mock implementation using hardcoded data."""

    def get_members(self, workspace_id: str = "default") -> list[dict[str, Any]]:
        logger.info(f"[MOCK] Fetching members for workspace: {workspace_id}")
        return MOCK_MEMBERS

    def create_task(self, task: dict[str, Any]) -> dict[str, Any]:
        logger.info(f"[MOCK] Creating task: {task.get('title', 'Untitled')}")
        return {"id": "task-mock-001", "status": "created", **task}

    def assign_task(
        self, task_id: str, assignments: list[dict[str, Any]]
    ) -> dict[str, Any]:
        logger.info(f"[MOCK] Assigning {len(assignments)} members to task {task_id}")
        return {"task_id": task_id, "assignments": assignments, "status": "assigned"}


# =============================================================================
# Real SE Backend Implementation (Production)
# =============================================================================

class SEBackendService(MemberServiceInterface):
    """Production implementation — calls real SE Java backend via HTTP."""

    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url or SE_BACKEND_URL).rstrip("/")
        self.api_url = f"{self.base_url}{SE_API_PREFIX}"
        self.client = httpx.Client(timeout=30.0)

    def get_members(self, workspace_id: str = "default") -> list[dict[str, Any]]:
        url = f"{self.api_url}/workspaces/{workspace_id}/members"
        logger.info(f"Fetching members from SE: {url}")
        response = self.client.get(url)
        response.raise_for_status()
        return response.json()

    def create_task(self, task: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.api_url}/tasks"
        logger.info(f"Creating task in SE: {task.get('title', 'Untitled')}")
        response = self.client.post(url, json=task)
        response.raise_for_status()
        return response.json()

    def assign_task(
        self, task_id: str, assignments: list[dict[str, Any]]
    ) -> dict[str, Any]:
        url = f"{self.api_url}/tasks/{task_id}/assignments"
        logger.info(f"Assigning task {task_id} in SE")
        response = self.client.post(url, json={"assignments": assignments})
        response.raise_for_status()
        return response.json()


# =============================================================================
# Factory
# =============================================================================

def get_member_service() -> MemberServiceInterface:
    """Factory: returns Mock or Real service based on config."""
    from app.config import USE_MOCK_DATA

    if USE_MOCK_DATA:
        logger.info("Using MockMemberService (no SE_BACKEND_URL configured)")
        return MockMemberService()
    else:
        logger.info(f"Using SEBackendService at {SE_BACKEND_URL}")
        return SEBackendService()
