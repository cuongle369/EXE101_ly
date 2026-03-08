import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState('login')
    const [name, setName] = useState('')

    const handleLogin = () => {
        if (!name.trim()) return
        localStorage.setItem('cafe_user', name.trim())
        setStep('role')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleLogin()
    }

    if (step === 'login') {
        return (
            <div className="landing-page">
                <div className="landing-card login-card">
                    <div className="landing-logo">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="10" fill="#6C63FF" />
                            <path d="M12 20.5l5 5 11-11" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="landing-title">Cafe Workshop</h1>
                    <p className="landing-subtitle">
                        Hệ thống quản lý công việc xưởng cafe thông minh
                    </p>

                    <div className="form-group" style={{ width: '100%', maxWidth: 360, marginTop: '2rem' }}>
                        <label>Tên hiển thị của bạn</label>
                        <input
                            type="text"
                            placeholder="VD: Nguyen Van A"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            maxLength={100}
                        />
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            onClick={handleLogin}
                            disabled={!name.trim()}
                        >
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
            <div className="landing-card role-card">
                <h1 className="landing-title">Chào mừng bạn trở lại!</h1>
                <p className="landing-subtitle">
                    Chọn vai trò để bắt đầu quản lý công việc cùng đội ngũ của bạn.
                </p>

                <div className="role-options">
                    <div className="role-option" onClick={() => navigate('/create-group')}>
                        <div className="role-icon-wrap role-icon-leader">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4-4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                        </div>
                        <h3>Tạo nhóm mới</h3>
                        <span className="role-tag">Bạn sẽ là Trưởng nhóm</span>
                        <p>Thiết lập không gian làm việc mới, mời thành viên và phân bố nhiệm vụ với sự hỗ trợ từ AI.</p>
                        <button className="btn btn-primary" style={{ width: '100%' }}>
                            Bắt đầu tạo nhóm
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="role-option" onClick={() => navigate('/join-group')}>
                        <div className="role-icon-wrap role-icon-member">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                            </svg>
                        </div>
                        <h3>Tham gia nhóm</h3>
                        <span className="role-tag role-tag-secondary">Nhập mã mời để tham gia</span>
                        <p>Kết nối với đồng nghiệp thông qua mã được chia sẻ từ Trưởng nhóm.</p>
                        <button className="btn btn-outline" style={{ width: '100%' }}>
                            Nhập mã mời
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
