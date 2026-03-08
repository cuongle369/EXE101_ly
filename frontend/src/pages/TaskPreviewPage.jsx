import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TaskPreview from '../components/TaskPreview'
import WorkloadDistribution from '../components/WorkloadDistribution'
import { submitReview } from '../services/api'

export default function TaskPreviewPage() {
    const location = useLocation()
    const navigate = useNavigate()

    const { threadId, standardizedTask, group } = location.state || {}
    const [task, setTask] = useState(standardizedTask)
    const [assignments, setAssignments] = useState(null)
    const [loading, setLoading] = useState(false)
    const [approved, setApproved] = useState(false)

    if (!threadId || !task) {
        return (
            <div className="container">
                <p>Không có công việc để xem trước. <a href="/" style={{ color: 'var(--primary)' }}>Tạo công việc mới</a></p>
            </div>
        )
    }

    const handleApprove = async () => {
        setLoading(true)
        try {
            const response = await submitReview(threadId, 'approve')
            if (response.assignments) {
                setAssignments(response.assignments)
                setApproved(true)
            }
        } catch (err) {
            console.error('Approve error:', err)
            alert(`Error: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        try {
            await submitReview(threadId, 'reject')
            navigate('/new-task')
        } catch (err) {
            console.error('Reject error:', err)
        }
    }

    const handleEdit = (editedData) => {
        // Update the local task state with edits
        setTask((prev) => ({
            ...prev,
            ...editedData,
        }))
    }

    return (
        <div className="container" style={{ maxWidth: 900 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Xem trước công việc</h1>
                    <p className="subtitle">
                        Xem lại chi tiết công việc và phân bố nhân sự trước khi xác nhận.
                    </p>
                </div>
                <span className="badge badge-info">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><polyline points="20 6 9 17 4 12" /></svg>
                    AI Đã Xử Lý
                </span>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <TaskPreview
                    task={task}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onEdit={handleEdit}
                    loading={loading}
                />

                {approved && assignments && (
                    <WorkloadDistribution assignments={assignments} />
                )}

                {approved && (
                    <div style={{
                        marginTop: '2rem', padding: '1rem', borderRadius: 'var(--radius)',
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            <span style={{ fontWeight: 600, color: '#15803d' }}>
                                Công việc đã được phê duyệt và phân công!
                            </span>
                        </div>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate('/dashboard')}
                        >
                            Xem Bảng điều khiển
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
