import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyTasks, updateAssignmentProgress } from '../services/api'

export default function EmployeeDashboard() {
    const navigate = useNavigate()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)

    const group = JSON.parse(localStorage.getItem('cafe_group') || 'null')
    const member = JSON.parse(localStorage.getItem('cafe_member') || 'null')

    useEffect(() => {
        if (!group || !member) { navigate('/'); return }
        loadTasks()
    }, [])

    const loadTasks = async () => {
        try {
            const myTasks = await getMyTasks(group.id, member.id)
            // Show only accepted tasks (progress or done)
            setTasks(myTasks.filter(t => t.assignment_status !== 'pending'))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleProgressChange = async (assignmentId, newProgress) => {
        // Update local state immediately for instant feedback
        setTasks(prev => prev.map(t =>
            t.assignment_id === assignmentId
                ? { ...t, progress: newProgress, assignment_status: newProgress >= 100 ? 'done' : 'progress' }
                : t
        ))

        // Send to backend
        try {
            await updateAssignmentProgress(assignmentId, newProgress)
        } catch (err) {
            console.error(err)
        }
    }

    const statusLabel = (s) => s === 'done' ? 'Hoàn thành' : s === 'progress' ? 'Đang làm' : 'Chờ nhận'
    const statusClass = (s) => s === 'done' ? 'status-done' : s === 'progress' ? 'status-progress' : 'status-pending'
    const priorityLabel = (p) => p === 'high' ? 'Cao' : p === 'low' ? 'Thấp' : 'Trung bình'
    const priorityClass = (p) => p === 'high' ? 'priority-high' : p === 'low' ? 'priority-low' : 'priority-medium'

    const inProgress = tasks.filter(t => t.assignment_status === 'progress')
    const done = tasks.filter(t => t.assignment_status === 'done')

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner" />
                <p>Đang tải công việc...</p>
            </div>
        )
    }

    return (
        <div className="employee-page">
            {/* Header */}
            <div className="emp-header">
                <div>
                    <span className="emp-role-tag">Thành viên</span>
                    <h1>Công việc của tôi</h1>
                    <p className="emp-subtitle">
                        Nhóm: {group?.name || 'N/A'} — {member?.name || 'N/A'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" onClick={() => navigate('/employee')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 12h-16M14 18l-6-6 6-6" />
                        </svg>
                        Hộp thư đến
                    </button>
                    <button className="btn btn-outline" onClick={() => { localStorage.clear(); navigate('/') }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Summary mini-stats */}
            <div className="emp-stats-row">
                <div className="emp-stat">
                    <div className="emp-stat-num" style={{ color: '#F97316' }}>{inProgress.length}</div>
                    <div className="emp-stat-label">Đang làm</div>
                </div>
                <div className="emp-stat">
                    <div className="emp-stat-num" style={{ color: '#22C55E' }}>{done.length}</div>
                    <div className="emp-stat-label">Hoàn thành</div>
                </div>
                <div className="emp-stat">
                    <div className="emp-stat-num" style={{ color: '#6C63FF' }}>{tasks.length}</div>
                    <div className="emp-stat-label">Tổng</div>
                </div>
            </div>

            {/* Task Table */}
            {tasks.length === 0 ? (
                <div className="empty-state" style={{ marginTop: '2rem' }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 12l2 2 4-4" />
                    </svg>
                    <p>Chưa có công việc nào đã nhận</p>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/employee')}>
                        Xem hộp thư đến
                    </button>
                </div>
            ) : (
                <div className="emp-task-table">
                    <div className="emp-table-header">
                        <span className="et-col-title">Tên công việc</span>
                        <span className="et-col-status">Trạng thái</span>
                        <span className="et-col-priority">Ưu tiên</span>
                        <span className="et-col-deadline">Hạn chót</span>
                        <span className="et-col-progress">Tiến độ</span>
                    </div>
                    {tasks.map(task => {
                        const prog = task.progress || 0
                        const isDone = task.assignment_status === 'done'
                        const sliderBg = `linear-gradient(90deg, #6C63FF ${prog}%, #E2E8F0 ${prog}%)`

                        return (
                            <div key={task.assignment_id} className={`emp-table-row ${isDone ? 'emp-row-done' : ''}`}>
                                <div className="et-col-title">
                                    <span className="et-task-name">{task.task_title}</span>
                                    {task.description && <span className="et-task-desc">{task.description}</span>}
                                </div>
                                <span className="et-col-status">
                                    <span className={`tts-badge ${statusClass(task.assignment_status)}`}>
                                        {statusLabel(task.assignment_status)}
                                    </span>
                                </span>
                                <span className="et-col-priority">
                                    <span className={`priority-badge ${priorityClass(task.priority)}`}>
                                        {priorityLabel(task.priority)}
                                    </span>
                                </span>
                                <span className="et-col-deadline">{task.deadline || '—'}</span>
                                <div className="et-col-progress">
                                    {isDone ? (
                                        <div className="auto-done-notice">
                                            <svg className="done-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                            100%
                                        </div>
                                    ) : (
                                        <div className="et-slider-wrap">
                                            <input
                                                type="range"
                                                className="progress-slider"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={prog}
                                                onChange={e => handleProgressChange(task.assignment_id, Number(e.target.value))}
                                                style={{ background: sliderBg }}
                                            />
                                            <span className="progress-slider-value">{prog}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
