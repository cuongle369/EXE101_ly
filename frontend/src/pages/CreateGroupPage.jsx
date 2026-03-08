import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGroup, addMember } from '../services/api'

export default function CreateGroupPage() {
    const navigate = useNavigate()
    const [groupName, setGroupName] = useState('')
    const [loading, setLoading] = useState(false)
    const [inviteCode, setInviteCode] = useState(null)
    const [groupData, setGroupData] = useState(null)
    const [copied, setCopied] = useState(false)

    const userName = localStorage.getItem('cafe_user') || 'User'

    const handleCreate = async () => {
        if (!groupName.trim()) return
        setLoading(true)
        try {
            const group = await createGroup(groupName.trim())
            const member = await addMember(group.id, userName, 'leader')
            localStorage.setItem('cafe_group', JSON.stringify(group))
            localStorage.setItem('cafe_member', JSON.stringify(member))
            setGroupData(group)
            setInviteCode(group.invite_code)
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleFinish = () => {
        navigate('/new-task')
    }

    if (inviteCode) {
        return (
            <div className="landing-page">
                <div className="landing-card" style={{ maxWidth: 520 }}>
                    <div className="invite-success-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Nhóm đã được tạo!</h2>
                    <p className="landing-subtitle" style={{ marginBottom: '1.5rem' }}>
                        Chia sẻ mã mời này cho thành viên để họ tham gia nhóm <strong>{groupData?.name}</strong>.
                    </p>

                    <div className="invite-code-display">
                        {inviteCode.split('').map((char, i) => (
                            <span key={i} className="invite-digit">{char}</span>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: 360, marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleCopy}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            {copied ? 'Đã sao chép!' : 'Sao chép mã'}
                        </button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleFinish}>
                            Tiếp tục
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        )
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

                <h2 style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>Tạo nhóm mới</h2>
                <p className="landing-subtitle">Đặt tên cho nhóm làm việc của bạn.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: 360, marginTop: '1.5rem' }}>
                    <div className="form-group">
                        <label>Tên nhóm</label>
                        <input
                            type="text"
                            placeholder="VD: Xưởng Rang Xay Buôn Ma Thuột"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            autoFocus
                            maxLength={100}
                        />
                    </div>
                    <div className="form-group">
                        <label>Trưởng nhóm</label>
                        <input type="text" value={userName} disabled style={{ opacity: 0.6 }} />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleCreate}
                        disabled={!groupName.trim() || loading}
                    >
                        {loading ? 'Đang tạo...' : 'Tạo nhóm'}
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
