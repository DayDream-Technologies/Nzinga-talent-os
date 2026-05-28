import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { AppDataProvider } from '@/context/AppDataContext'
import { CompanyCodePage } from '@/pages/CompanyCodePage'
import { LoginPage } from '@/pages/LoginPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './index.css'

const ProspectPortalPage = lazy(() => import('@/pages/ProspectPortalPage').then(m => ({ default: m.ProspectPortalPage })))
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

function L({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

const router = createBrowserRouter([
  { path: '/', element: <CompanyCodePage /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/portal',
    element: (
      <L>
        <AppDataProvider>
          <ProspectPortalPage />
        </AppDataProvider>
      </L>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: (
          <AppDataProvider>
            <AppShell />
          </AppDataProvider>
        ),
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <L><DashboardPage /></L> },
          { path: 'workspace', element: <L><WorkspacePage /></L> },
          { path: 'pipeline', element: <L><PipelinePage /></L> },
          { path: 'roster', element: <L><RosterPage /></L> },
          { path: 'tasks', element: <L><TasksPage /></L> },
          { path: 'history', element: <L><HistoryPage /></L> },
          { path: 'reports', element: <L><ReportsPage /></L> },
          { path: 'applications', element: <L><ApplicationsPage /></L> },
          { path: 'new-entry', element: <L><NewEntryPage /></L> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
