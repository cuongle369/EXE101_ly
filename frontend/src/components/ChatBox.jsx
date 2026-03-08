import { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'

export default function ChatBox({ messages, onSend, loading }) {
    const [input, setInput] = useState('')
    const messagesEndRef = useRef(null)
    const textareaRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSubmit = () => {
        if (!input.trim() || loading) return
        onSend(input.trim())
        setInput('')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 420 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.875rem', fontWeight: 700,
                    }}>
                        ✦
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1rem', margin: 0 }}>AI Xử Lý Công Việc</h2>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mô tả mục tiêu một cách tự nhiên</span>
                    </div>
                </div>
                <a href="#" style={{ color: 'var(--primary)', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none' }}>
                    📖 Xem ví dụ
                </a>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '0.5rem 0',
                minHeight: 200, maxHeight: 320,
            }}>
                {messages.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem' }}>
                        <p style={{ fontWeight: 500, marginBottom: '0.75rem' }}>Bạn cần làm gì?</p>
                        <p style={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                            VD: Thu hoạch 50 tấn cà phê trước ngày 30/10. Có 3 đội
                            làm việc và cần xoay ca mỗi 6 tiếng. Kiểm tra chất lượng
                            mỗi 2 tấn.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <ChatMessage key={i} role={msg.role} content={msg.content} />
                    ))
                )}
                {loading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        <div className="spinner" />
                        AI đang xử lý...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />

            {/* Input Area */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Mô tả công việc cần thực hiện..."
                    rows={2}
                    style={{
                        flex: 1, resize: 'none', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem',
                        fontFamily: 'inherit', fontSize: '0.875rem', lineHeight: 1.5,
                        background: 'var(--bg-white)',
                    }}
                />
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={!input.trim() || loading}
                    style={{ height: 'fit-content' }}
                >
                    {loading ? <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> : '✦'}
                    {messages.length === 0 ? 'Xử lý với AI' : 'Gửi'}
                </button>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <span>✦</span>
                <span>AI sẽ tạo công việc, phân công và hạn chót.</span>
            </div>
        </div>
    )
}
