import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GroupIdentity from '../components/GroupIdentity'
import ChatBox from '../components/ChatBox'
import { startChat, sendMessage } from '../services/api'

export default function NewTaskPage() {
    const navigate = useNavigate()

    // Auto-fill group name from localStorage
    const storedGroup = JSON.parse(localStorage.getItem('cafe_group') || 'null')

    const [group, setGroup] = useState({
        groupName: storedGroup?.name || '',
        category: 'Rang xay',
        priority: 'medium',
    })

    const [messages, setMessages] = useState([])
    const [threadId, setThreadId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(null)

    const handleSend = async (text) => {
        // Add user message to chat
        const userMsg = { role: 'user', content: text }
        setMessages((prev) => [...prev, userMsg])
        setLoading(true)

        try {
            let response

            if (!threadId) {
                // First message — start new session
                response = await startChat({
                    rawInput: text,
                    groupName: group.groupName,
                    category: group.category,
                    priority: group.priority,
                })
                setThreadId(response.thread_id)
            } else {
                // Follow-up — send clarification reply
                response = await sendMessage(threadId, text)
            }

            setStatus(response.status)

            if (response.status === 'clarifying' && response.clarification_questions) {
                // Agent has questions — show them in chat
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: response.clarification_questions },
                ])
            } else if (response.status === 'standardized') {
                // Task is ready — go to preview page
                navigate('/preview', {
                    state: {
                        threadId: response.thread_id,
                        standardizedTask: response.standardized_task,
                        group,
                    },
                })
            }
        } catch (err) {
            console.error('Error:', err)
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `❌ Error: ${err.message}` },
            ])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <a className="back-link" onClick={() => navigate('/dashboard')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Quay lại Dashboard
            </a>

            <h1 style={{ marginBottom: '0.25rem' }}>Tạo công việc mới</h1>
            <p className="subtitle" style={{ marginBottom: '2rem' }}>
                Mô tả nhiệm vụ cần thực hiện, AI sẽ phân tích và chuẩn hóa thành task có cấu trúc.
            </p>

            <div className="split-layout">
                <GroupIdentity value={group} onChange={setGroup} />
                <ChatBox messages={messages} onSend={handleSend} loading={loading} />
            </div>
        </div>
    )
}
