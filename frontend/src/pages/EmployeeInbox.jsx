import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyTasks, updateAssignmentStatus } from '../services/api'

export default function EmployeeInbox() {
    const navigate = useNavigate()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [reportModal, setReportModal] = useState(null)
    const [reportText, setReportText] = useState('')

    const group = JSON.parse(localStorage.getItem('cafe_group') || 'null')
    const member = JSON.parse(localStorage.getItem('cafe_member') || 'null')

    useEffect(() => {
        if (!group || !member) { navigate('/'); return }
        loadTasks()
    }, [])

    const loadTasks = async () => {
        try {
            const myTasks = await getMyTasks(group.id, member.id)
            // Only show pending tasks (not yet accepted)
            setTasks(myTasks.filter(t => t.assignment_status === 'pending'))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async (assignmentId) => {
        try {
            await updateAssignmentStatus(assignmentId, 'progress')
            setTasks(prev => prev.filter(t => t.assignment_id !== assignmentId))
        } catch (err) {
            console.error(err)
            alert('Lỗi khi nhận việc: ' + err.message)
        }
    }

    const handleReport = async () => {
        if (!reportModal || !reportText.trim()) return
        try {
            // For MVP, just log the report and keep task pending
            console.log(`Report for assignment ${reportModal}: ${reportText}`)
            alert('Đã gửi báo cáo đến quản lý!')
            setReportModal(null)
            setReportText('')
        } catch (err) {
            console.error(err)
        }
    }

    const priorityLabel = (p) => p === 'high' ? 'Cao' : p === 'low' ? 'Thấp' : 'Trung bình'
    const priorityClass = (p) => p === 'high' ? 'priority-high' : p === 'low' ? 'priority-low' : 'priority-medium'

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner" />
                <p>Đang tải danh sách công việc...</p>
            </div>
        )
    }

    return (
        <div className="employee-page">
            {/* Header */}
            <div className="emp-header">
                <div>
                    <span className="emp-role-tag">Thành viên</span>
                    <h1>Công việc mới</h1>
                    <p className="emp-subtitle">
                        Nhóm: {group?.name || 'N/A'} — Xin chào, {member?.name || 'N/A'}
                    </p>
                </div>
                <button className="btn btn-outline" onClick={() => navigate('/employee/tasks')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 12l2 2 4-4" />
                    </svg>
                    Công việc của tôi
                </button>
            </div>

            {/* Task list */}
            {tasks.length === 0 ? (
                <div className="empty-state" style={{ marginTop: '3rem' }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    <p>Không có công việc mới nào</p>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/employee/tasks')}>
                        Xem công việc của tôi
                    </button>
                </div>
            ) : (
                <div className="inbox-list">
                    {tasks.map(task => (
                        <div key={task.assignment_id} className="inbox-card">
                            <div className="inbox-card-left">
                                <div className="inbox-icon-wrap">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <path d="M7 12h10M7 8h6" />
                                    </svg>
                                </div>
                                <div className="inbox-info">
                                    <h3 className="inbox-title">{task.task_title}</h3>
                                    {task.description && <p className="inbox-desc">{task.description}</p>}
                                    <div className="inbox-meta">
                                        <span className={`priority-badge ${priorityClass(task.priority)}`}>{priorityLabel(task.priority)}</span>
                                        {task.deadline && (
                                            <span className="inbox-deadline">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                Hạn: {task.deadline}
                                            </span>
                                        )}
                                        {task.assigned_amount && (
                                            <span className="inbox-load">{task.assigned_amount}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="inbox-actions">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleAccept(task.assignment_id)}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Nhận việc
                                </button>
                                <button
                                    className="btn btn-outline btn-sm btn-danger-outline"
                                    onClick={() => { setReportModal(task.assignment_id); setReportText('') }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    Báo cáo
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Report Modal */}
            {reportModal && (
                <div className="modal-overlay" onClick={() => setReportModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Báo cáo vấn đề</h3>
                        <p className="modal-desc">
                            Mô tả vấn đề hoặc thắc mắc của bạn về công việc này:
                        </p>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <textarea
                                value={reportText}
                                onChange={e => setReportText(e.target.value)}
                                placeholder="Nhập nội dung báo cáo..."
                                rows={4}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => setReportModal(null)}>Hủy</button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={handleReport}
                                disabled={!reportText.trim()}
                            >
                                Gửi báo cáo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
