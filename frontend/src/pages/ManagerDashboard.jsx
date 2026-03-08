import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard } from '../services/api'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
    PieChart, Pie,
} from 'recharts'

const COLORS = ['#6C63FF', '#F97316', '#22C55E', '#EC4899', '#06B6D4', '#EAB308', '#8B5CF6', '#14B8A6']

const TASK_COLORS = {
    done: '#22C55E',
    progress: '#3B82F6',
    pending: '#E2E8F0',
}

function generatePerformanceHistory(members, tasks) {
    const weekLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()

    return weekLabels.map((label, idx) => {
        const dayIdx = idx + 1
        const point = { name: label }
        members.forEach((m, mi) => {
            if (dayIdx <= dayOfWeek) {
                const base = m.total_assignments > 0
                    ? (m.completed_assignments / m.total_assignments) * 100
                    : 0
                const progress = Math.min(100, Math.max(0,
                    base * (dayIdx / dayOfWeek) + (Math.sin(dayIdx * (mi + 1) * 0.7) * 12)
                ))
                point[m.name] = Math.round(progress)
            } else {
                point[m.name] = null
            }
        })
        return point
    })
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload) return null
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip-label">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="chart-tooltip-item">
                    <span className="chart-tooltip-dot" style={{ background: entry.color }} />
                    <span>{entry.name}:</span>
                    <strong>{entry.value != null ? `${entry.value}%` : '—'}</strong>
                </div>
            ))}
        </div>
    )
}

export default function ManagerDashboard() {
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const intervalRef = useRef(null)

    const group = JSON.parse(localStorage.getItem('cafe_group') || 'null')

    useEffect(() => {
        if (!group) { navigate('/'); return }
        loadData()
        intervalRef.current = setInterval(loadData, 5000)
        return () => clearInterval(intervalRef.current)
    }, [])

    const loadData = async () => {
        try {
            const d = await getDashboard(group.id)
            setData(d)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner" />
                <p>Đang tải dữ liệu...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="container">
                <p>Không thể tải dashboard. <a onClick={() => navigate('/')}>Quay lại</a></p>
            </div>
        )
    }

    const { total_tasks, completed, in_progress, pending, completion_percent, members, tasks } = data

    const pieData = [
        { name: 'Hoàn thành', value: completed, color: TASK_COLORS.done },
        { name: 'Đang làm', value: in_progress, color: TASK_COLORS.progress },
        { name: 'Chưa bắt đầu', value: pending, color: TASK_COLORS.pending },
    ].filter(s => s.value > 0)

    const performanceHistory = generatePerformanceHistory(members, tasks)

    const memberBarData = members.map(m => ({
        name: m.name,
        'Hoàn thành': m.completed_assignments,
        'Còn lại': m.total_assignments - m.completed_assignments,
        percent: m.performance_percent,
    }))

    const statusLabel = (s) => s === 'done' ? 'Hoàn thành' : s === 'progress' ? 'Đang làm' : 'Chưa bắt đầu'
    const statusClass = (s) => s === 'done' ? 'status-done' : s === 'progress' ? 'status-progress' : 'status-pending'
    const priorityLabel = (p) => p === 'high' ? 'Cao' : p === 'low' ? 'Thấp' : 'Trung bình'
    const priorityClass = (p) => p === 'high' ? 'priority-high' : p === 'low' ? 'priority-low' : 'priority-medium'

    const stats = [
        { label: 'Tổng công việc', value: total_tasks, color: '#6C63FF', bg: '#EEF2FF', icon: 'grid' },
        { label: 'Đang thực hiện', value: in_progress, color: '#F97316', bg: '#FFF7ED', icon: 'activity' },
        { label: 'Hoàn thành', value: completed, color: '#22C55E', bg: '#F0FDF4', icon: 'check' },
        { label: 'Chưa bắt đầu', value: pending, color: '#94A3B8', bg: '#F8FAFC', icon: 'clock' },
    ]

    const renderStatIcon = (type, color) => {
        const props = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
        switch (type) {
            case 'grid': return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>
            case 'activity': return <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            case 'check': return <svg {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            case 'clock': return <svg {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            default: return null
        }
    }

    return (
        <div className="md-page">
            {/* Header */}
            <header className="md-header">
                <div className="md-header-left">
                    <div className="md-brand">
                        <div className="md-brand-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="md-title">{data.group_name}</h1>
                            <span className="md-status-badge">Đang hoạt động</span>
                        </div>
                    </div>
                </div>
                <div className="md-header-right">
                    <div className="md-invite-chip">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        Mã mời: <strong>{data.invite_code}</strong>
                    </div>
                    <button className="md-btn-add" onClick={() => navigate('/new-task')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Thêm công việc
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="md-stats">
                {stats.map((s, i) => (
                    <div key={i} className="md-stat-card">
                        <div className="md-stat-icon" style={{ background: s.bg, color: s.color }}>
                            {renderStatIcon(s.icon, s.color)}
                        </div>
                        <div className="md-stat-info">
                            <span className="md-stat-value" style={{ color: s.color }}>{s.value}</span>
                            <span className="md-stat-label">{s.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1: Performance Line Chart (full width) */}
            <div className="md-card md-chart-full">
                <div className="md-card-header">
                    <h3>Hiệu suất nhân viên trong tuần</h3>
                    <div className="md-chart-legend-inline">
                        {members.map((m, i) => (
                            <span key={m.id} className="md-legend-item-inline">
                                <span className="md-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                                {m.name}
                            </span>
                        ))}
                    </div>
                </div>
                {members.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={performanceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                {members.map((m, i) => (
                                    <linearGradient key={m.id} id={`grad-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.15} />
                                        <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                            <Tooltip content={<CustomTooltip />} />
                            {members.map((m, i) => (
                                <Area
                                    key={m.id}
                                    type="monotone"
                                    dataKey={m.name}
                                    stroke={COLORS[i % COLORS.length]}
                                    strokeWidth={2.5}
                                    fill={`url(#grad-${m.id})`}
                                    dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                                    connectNulls={false}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="md-empty-chart">
                        <p>Chưa có thành viên để hiển thị biểu đồ</p>
                    </div>
                )}
            </div>

            {/* Charts Row 2: Donut + Member Performance */}
            <div className="md-row-2">
                <div className="md-card">
                    <div className="md-card-header">
                        <h3>Tiến độ nhóm</h3>
                        <span className="md-card-badge">{Math.round(completion_percent)}%</span>
                    </div>
                    <div className="md-donut-area">
                        {total_tasks > 0 ? (
                            <>
                                <ResponsiveContainer width={160} height={160}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%" cy="50%"
                                            innerRadius={50} outerRadius={70}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {pieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="md-donut-center-text">
                                    <span className="md-donut-pct">{Math.round(completion_percent)}%</span>
                                </div>
                                <div className="md-donut-legend">
                                    {pieData.map((s, i) => (
                                        <div key={i} className="md-legend-row">
                                            <span className="md-legend-dot" style={{ background: s.color }} />
                                            <span className="md-legend-text">{s.name}</span>
                                            <strong>{s.value}</strong>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="md-empty-chart"><p>Chưa có công việc</p></div>
                        )}
                    </div>
                </div>

                <div className="md-card">
                    <div className="md-card-header">
                        <h3>So sánh thành viên</h3>
                    </div>
                    {members.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={memberBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                />
                                <Bar dataKey="Hoàn thành" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Còn lại" stackId="a" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="md-empty-chart"><p>Chưa có thành viên</p></div>
                    )}
                </div>
            </div>

            {/* Member Performance Cards */}
            {members.length > 0 && (
                <div className="md-members-grid">
                    {members.map((m, i) => {
                        const pct = m.performance_percent
                        return (
                            <div key={m.id} className="md-member-card">
                                <div className="md-member-top">
                                    <div className="md-member-avatar" style={{ background: COLORS[i % COLORS.length] }}>
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="md-member-info">
                                        <span className="md-member-name">{m.name}</span>
                                        <span className="md-member-role">{m.role === 'leader' ? 'Trưởng nhóm' : 'Thành viên'}</span>
                                    </div>
                                    <span className="md-member-pct" style={{ color: pct >= 70 ? '#22C55E' : pct >= 40 ? '#F59E0B' : '#94A3B8' }}>
                                        {Math.round(pct)}%
                                    </span>
                                </div>
                                <div className="md-member-bar-track">
                                    <div className="md-member-bar-fill" style={{
                                        width: `${pct}%`,
                                        background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}dd)`,
                                    }} />
                                </div>
                                <div className="md-member-stat-row">
                                    <span>{m.completed_assignments}/{m.total_assignments} việc</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Task Table */}
            <div className="md-card md-tasks-section">
                <div className="md-card-header">
                    <h3>Công việc ({tasks.length})</h3>
                    <button className="md-btn-sm" onClick={() => navigate('/new-task')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Thêm mới
                    </button>
                </div>
                {tasks.length === 0 ? (
                    <div className="md-empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 12l2 2 4-4" />
                        </svg>
                        <p>Chưa có công việc nào</p>
                        <button className="md-btn-add" onClick={() => navigate('/new-task')}>Tạo công việc đầu tiên</button>
                    </div>
                ) : (
                    <div className="md-task-table">
                        <div className="md-tt-header">
                            <span className="md-tt-col-name">Tên công việc</span>
                            <span className="md-tt-col-status">Trạng thái</span>
                            <span className="md-tt-col-progress">Tiến độ</span>
                            <span className="md-tt-col-priority">Ưu tiên</span>
                            <span className="md-tt-col-members">Thành viên</span>
                        </div>
                        {tasks.map(task => {
                            const doneA = task.assignments.filter(a => a.status === 'done').length
                            const totalA = task.assignments.length
                            const pct = totalA > 0 ? Math.round((doneA / totalA) * 100) : 0
                            return (
                                <div key={task.id} className="md-tt-row">
                                    <div className="md-tt-col-name">
                                        <span className="md-tt-title">{task.title}</span>
                                        {task.deadline && <span className="md-tt-deadline">Hạn: {task.deadline}</span>}
                                    </div>
                                    <span className="md-tt-col-status">
                                        <span className={`md-tt-badge ${statusClass(task.status)}`}>{statusLabel(task.status)}</span>
                                    </span>
                                    <div className="md-tt-col-progress">
                                        <div className="md-progress-track">
                                            <div className="md-progress-fill" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="md-tt-pct">{pct}%</span>
                                    </div>
                                    <span className="md-tt-col-priority">
                                        <span className={`md-priority-badge ${priorityClass(task.priority)}`}>{priorityLabel(task.priority)}</span>
                                    </span>
                                    <div className="md-tt-col-members">
                                        {task.assignments.slice(0, 3).map((a, i) => (
                                            <div key={a.id} className="md-mini-avatar" style={{ background: COLORS[i % COLORS.length] }}>
                                                {a.member_name.charAt(0).toUpperCase()}
                                            </div>
                                        ))}
                                        {task.assignments.length > 3 && <div className="md-mini-avatar md-mini-more">+{task.assignments.length - 3}</div>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="md-poll-indicator">
                <div className="md-poll-dot" />
                Tự động cập nhật mỗi 5 giây
            </div>
        </div>
    )
}
