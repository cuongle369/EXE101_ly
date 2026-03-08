export default function ChatMessage({ role, content }) {
    const isUser = role === 'user'

    return (
        <div
            className="animate-fade-in"
            style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                marginBottom: '0.75rem',
            }}
        >
            <div
                style={{
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    borderRadius: isUser
                        ? '12px 12px 4px 12px'
                        : '12px 12px 12px 4px',
                    background: isUser ? 'var(--primary)' : 'var(--bg-input)',
                    color: isUser ? 'var(--text-white)' : 'var(--text)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                }}
            >
                {content}
            </div>
        </div>
    )
}
