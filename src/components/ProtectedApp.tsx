import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppDataProvider } from '@/context/AppDataContext'
import { AppShell } from '@/components/layout/AppShell'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const WorkspacePage = lazy(() => import('@/pages/WorkspacePage').then(m => ({ default: m.WorkspacePage })))
const PipelinePage = lazy(() => import('@/pages/PipelinePage').then(m => ({ default: m.PipelinePage })))
const RosterPage = lazy(() => import('@/pages/RosterPage').then(m => ({ default: m.RosterPage })))
const TasksPage = lazy(() => import('@/pages/TasksPage').then(m => ({ default: m.TasksPage })))
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then(m => ({ default: m.HistoryPage })))
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then(m => ({ default: m.ReportsPage })))
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage').then(m => ({ default: m.ApplicationsPage })))
const NewEntryPage = lazy(() => import('@/pages/NewEntryPage').then(m => ({ default: m.NewEntryPage })))

function PageLoader() {
  return <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, fontSize: 14, color: '#6b7280' }}>Loading…</div>
}

export default function ProtectedApp() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />

  return (
    <AppDataProvider>
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="roster" element={<RosterPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="new-entry" element={<NewEntryPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </AppDataProvider>
  )
}
