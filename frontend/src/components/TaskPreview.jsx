import { useState } from 'react'

export default function TaskPreview({ task, onApprove, onReject, onEdit, loading }) {
    const [editing, setEditing] = useState(false)
    const [editData, setEditData] = useState(null)

    const priorityClass = {
        high: 'badge-high',
        medium: 'badge-medium',
        low: 'badge-low',
    }[task?.priority] || 'badge-medium'

    if (!task) return null

    // Description: support both description_points (array) and description (string)
    const descriptionPoints = task.description_points ||
        (task.description ? [task.description] : [])

    const handleStartEdit = () => {
        setEditData({
            task_title: task.task_title,
            description_points: [...descriptionPoints],
            deadline: task.deadline || '',
            priority: task.priority,
        })
        setEditing(true)
    }

    const handleSaveEdit = () => {
        if (onEdit) {
            onEdit(editData)
        }
        setEditing(false)
    }

    const handleCancelEdit = () => {
        setEditData(null)
        setEditing(false)
    }

    const updatePoint = (index, value) => {
        const updated = [...editData.description_points]
        updated[index] = value
        setEditData({ ...editData, description_points: updated })
    }

    const addPoint = () => {
        setEditData({
            ...editData,
            description_points: [...editData.description_points, ''],
        })
    }

    const removePoint = (index) => {
        const updated = editData.description_points.filter((_, i) => i !== index)
        setEditData({ ...editData, description_points: updated })
    }

    return (
        <div className="card animate-slide-up" style={{ marginBottom: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.125rem' }}>📋</span>
                    <h2 style={{ margin: 0 }}>Công việc đã chuẩn hóa</h2>
                </div>
                {!editing && (
                    <button
                        className="btn"
                        onClick={handleStartEdit}
                        style={{ padding: '0.375rem 0.625rem', color: 'var(--text-muted)', background: 'transparent', fontSize: '0.875rem' }}
                        title="Chỉnh sửa"
                    >
                        ✏️
                    </button>
                )}
            </div>

            {/* === VIEW MODE === */}
            {!editing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Title */}
                    <Row label="Tên công việc">
                        <span style={{ fontWeight: 600 }}>{task.task_title}</span>
                    </Row>

                    <Divider />

                    {/* Description as bullet points */}
                    <Row label="Mô tả">
                        <ul style={{
                            margin: 0, paddingLeft: '1.125rem',
                            display: 'flex', flexDirection: 'column', gap: '0.375rem',
                        }}>
                            {descriptionPoints.map((point, i) => (
                                <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </Row>

                    <Divider />

                    {/* Deadline */}
                    <Row label="Hạn chót">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                            📅 {task.deadline ? new Date(task.deadline).toLocaleString() : 'Chưa đặt'}
                        </span>
                    </Row>

                    <Divider />

                    {/* Priority */}
                    <Row label="Ưu tiên">
                        <span className={`badge ${priorityClass}`}>{task.priority}</span>
                    </Row>

                    {/* Skills */}
                    {task.required_skills && task.required_skills.length > 0 && (
                        <>
                            <Divider />
                            <Row label="Kỹ năng">
                                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                    {task.required_skills.map((s, i) => (
                                        <span key={i} className="badge badge-info">{s}</span>
                                    ))}
                                </div>
                            </Row>
                        </>
                    )}
                </div>
            )}

            {/* === EDIT MODE === */}
            {editing && editData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Title */}
                    <div className="form-group">
                        <label>Tên công việc</label>
                        <input
                            type="text"
                            value={editData.task_title}
                            onChange={(e) => setEditData({ ...editData, task_title: e.target.value })}
                        />
                    </div>

                    {/* Description Points */}
                    <div className="form-group">
                        <label>Chi tiết mô tả</label>
                        {editData.description_points.map((point, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.375rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', minWidth: 16 }}>•</span>
                                <input
                                    type="text"
                                    value={point}
                                    onChange={(e) => updatePoint(i, e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    onClick={() => removePoint(i)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--danger)', fontSize: '1rem', padding: '0.25rem',
                                    }}
                                    title="Remove"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addPoint}
                            className="btn btn-outline"
                            style={{ alignSelf: 'flex-start', fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                        >
                            + Thêm mục
                        </button>
                    </div>

                    {/* Deadline */}
                    <div className="form-group">
                        <label>Hạn chót</label>
                        <input
                            type="datetime-local"
                            value={editData.deadline ? editData.deadline.slice(0, 16) : ''}
                            onChange={(e) => setEditData({ ...editData, deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        />
                    </div>

                    {/* Priority */}
                    <div className="form-group">
                        <label>Ưu tiên</label>
                        <div className="priority-group">
                            {['low', 'medium', 'high'].map((p) => (
                                <button
                                    key={p}
                                    className={editData.priority === p ? 'active' : ''}
                                    onClick={() => setEditData({ ...editData, priority: p })}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Save/Cancel */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" onClick={handleCancelEdit}>Hủy</button>
                        <button className="btn btn-primary" onClick={handleSaveEdit}>Lưu thay đổi</button>
                    </div>
                </div>
            )}

            {/* Action Buttons (only in view mode) */}
            {!editing && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-danger" onClick={onReject} disabled={loading}>
                        Từ chối
                    </button>
                    <button className="btn btn-primary" onClick={onApprove} disabled={loading}>
                        {loading ? (
                            <><div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Đang duyệt...</>
                        ) : '✓ Phê duyệt'}
                    </button>
                </div>
            )}
        </div>
    )
}

/* Helper components */
function Row({ label, children }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
            <div>{children}</div>
        </div>
    )
}

function Divider() {
    return <div style={{ borderTop: '1px solid var(--border-light)' }} />
}
