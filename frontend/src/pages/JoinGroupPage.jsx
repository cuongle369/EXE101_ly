import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { joinGroup, addMember } from '../services/api'

export default function JoinGroupPage() {
    const navigate = useNavigate()
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)

    const userName = localStorage.getItem('cafe_user') || 'User'

    const handleJoin = async () => {
        if (code.trim().length < 6) return
        setLoading(true)
        try {
            const group = await joinGroup(code.trim().toUpperCase())
            const member = await addMember(group.id, userName, 'member')
            localStorage.setItem('cafe_group', JSON.stringify(group))
            localStorage.setItem('cafe_member', JSON.stringify(member))
            navigate('/employee')
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="landing-page">
            <div className="landing-card" style={{ maxWidth: 480 }}>
                <a className="back-link" onClick={() => navigate('/')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Quay lại
                </a>

                <h2 style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>Tham gia nhóm</h2>
                <p className="landing-subtitle">Nhập mã mời 6 ký tự từ Trưởng nhóm.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: 360, marginTop: '1.5rem' }}>
                    <div className="form-group">
                        <label>Mã mời</label>
                        <input
                            type="text"
                            className="invite-input"
                            placeholder="VD: HV9921"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                            autoFocus
                            maxLength={6}
                        />
                    </div>
                    <div className="form-group">
                        <label>Tên của bạn</label>
                        <input type="text" value={userName} disabled style={{ opacity: 0.6 }} />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleJoin}
                        disabled={code.trim().length < 6 || loading}
                    >
                        {loading ? 'Đang tham gia...' : 'Tham gia nhóm'}
                        {!loading && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
