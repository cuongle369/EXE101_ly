// =============================================================================
// API Service — Communicates with Backend
// =============================================================================

const API_BASE = '/api';

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || 'Request failed');
    }

    if (res.status === 204) return null;
    return res.json();
}

// ====== AI Chat ======

export async function startChat({ rawInput, groupName, category, priority }) {
    return request('/chat/start', {
        method: 'POST',
        body: JSON.stringify({
            raw_input: rawInput,
            group_name: groupName,
            category: category,
            priority: priority,
        }),
    });
}

export async function sendMessage(threadId, message) {
    return request(`/chat/${threadId}/message`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

export async function getState(threadId) {
    return request(`/chat/${threadId}/state`);
}

export async function submitReview(threadId, decision, edits = null) {
    return request(`/chat/${threadId}/review`, {
        method: 'POST',
        body: JSON.stringify({ decision, edits }),
    });
}

export async function listMembers() {
    return request('/members');
}

// ====== Groups ======

export async function createGroup(name) {
    return request('/groups', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
}

export async function joinGroup(inviteCode) {
    return request('/groups/join', {
        method: 'POST',
        body: JSON.stringify({ invite_code: inviteCode }),
    });
}

export async function getGroup(groupId) {
    return request(`/groups/${groupId}`);
}

// ====== Members ======

export async function addMember(groupId, name, role = 'member') {
    return request(`/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ name, role }),
    });
}

export async function getGroupMembers(groupId) {
    return request(`/groups/${groupId}/members`);
}

// ====== Tasks ======

export async function createTask(groupId, taskData) {
    return request(`/groups/${groupId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(taskData),
    });
}

export async function getGroupTasks(groupId) {
    return request(`/groups/${groupId}/tasks`);
}

export async function getTask(taskId) {
    return request(`/tasks/${taskId}`);
}

export async function updateTaskStatus(taskId, status) {
    return request(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export async function updateTask(taskId, data) {
    return request(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deleteTask(taskId) {
    return request(`/tasks/${taskId}`, { method: 'DELETE' });
}

// ====== Assignments ======

export async function updateAssignmentStatus(assignmentId, status) {
    return request(`/assignments/${assignmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export async function updateAssignmentProgress(assignmentId, progress) {
    return request(`/assignments/${assignmentId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ progress }),
    });
}

// ====== Dashboard ======

export async function getDashboard(groupId) {
    return request(`/groups/${groupId}/dashboard`);
}

// ====== Employee Tasks ======

export async function getMyTasks(groupId, memberId) {
    return request(`/groups/${groupId}/members/${memberId}/tasks`);
}
