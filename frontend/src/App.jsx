import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CreateGroupPage from './pages/CreateGroupPage'
import JoinGroupPage from './pages/JoinGroupPage'
import NewTaskPage from './pages/NewTaskPage'
import TaskPreviewPage from './pages/TaskPreviewPage'
import ManagerDashboard from './pages/ManagerDashboard'
import EmployeeInbox from './pages/EmployeeInbox'
import EmployeeDashboard from './pages/EmployeeDashboard'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/create-group" element={<CreateGroupPage />} />
                <Route path="/join-group" element={<JoinGroupPage />} />
                <Route path="/new-task" element={<NewTaskPage />} />
                <Route path="/preview" element={<TaskPreviewPage />} />
                <Route path="/dashboard" element={<ManagerDashboard />} />
                <Route path="/employee" element={<EmployeeInbox />} />
                <Route path="/employee/tasks" element={<EmployeeDashboard />} />
            </Routes>
        </BrowserRouter>
    )
}
