export default function WorkloadCard({ assignment }) {
    const matchScore = assignment.match_score || 0
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
    const colorIdx = (assignment.member_name || '').charCodeAt(0) % colors.length
    const barColor = colors[colorIdx]

    return (
        <div className="card animate-fade-in" style={{ padding: '1rem', minWidth: 180 }}>
            {/* Member Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: `${barColor}20`, color: barColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.875rem',
                }}>
                    {(assignment.member_name || '?')[0]}
                </div>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{assignment.member_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{assignment.role}</div>
                </div>
                <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: matchScore >= 70 ? 'var(--success)' : matchScore >= 40 ? 'var(--warning)' : 'var(--danger)',
                }}>
                    {matchScore}%
                </span>
            </div>

            {/* Assigned Load */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.375rem 0.625rem', borderRadius: 'var(--radius-sm)',
                background: `${barColor}10`, marginBottom: '0.5rem',
            }}>
                <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-bar-fill" style={{ width: `${assignment.assigned_load || 0}%`, background: barColor }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: barColor, whiteSpace: 'nowrap' }}>
                    Khối lượng&nbsp;&nbsp;{assignment.assigned_load}%
                </span>
            </div>

            {/* Reason */}
            <p style={{
                fontSize: '0.75rem', color: 'var(--text-muted)',
                fontStyle: 'italic', margin: 0, lineHeight: 1.5,
            }}>
                "{assignment.reason}"
            </p>
        </div>
    )
}
