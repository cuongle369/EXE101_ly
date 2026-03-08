import WorkloadCard from './WorkloadCard'

export default function WorkloadDistribution({ assignments }) {
    if (!assignments || assignments.length === 0) return null

    return (
        <div className="animate-slide-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.125rem' }}>⚡</span>
                <h2 style={{ margin: 0 }}>Phân bổ công việc bởi AI</h2>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1rem',
            }}>
                {assignments.map((a, i) => (
                    <WorkloadCard key={a.member_id || i} assignment={a} />
                ))}

                {/* Add Member placeholder */}
                <div
                    className="card"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', gap: '0.375rem',
                        padding: '1.5rem', minWidth: 180, minHeight: 120,
                        border: '2px dashed var(--border)', cursor: 'pointer',
                        color: 'var(--text-muted)', transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                    <span style={{ fontSize: '1.5rem' }}>＋</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Thêm thành viên</span>
                </div>
            </div>
        </div>
    )
}
