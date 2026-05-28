import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { CompanyCodePage } from '@/pages/CompanyCodePage'
import { LoginPage } from '@/pages/LoginPage'
import { ProspectPortalPage } from '@/pages/ProspectPortalPage'

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const WorkspacePage = lazy(() =>
  import('@/pages/WorkspacePage').then((m) => ({ default: m.WorkspacePage })),
)
const PipelinePage = lazy(() =>
  import('@/pages/PipelinePage').then((m) => ({ default: m.PipelinePage })),
)
const RosterPage = lazy(() => import('@/pages/RosterPage').then((m) => ({ default: m.RosterPage })))
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })))
const HistoryPage = lazy(() =>
  import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
)
const ReportsPage = lazy(() =>
  import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
const ApplicationsPage = lazy(() =>
  import('@/pages/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })),
)
const NewEntryPage = lazy(() =>
  import('@/pages/NewEntryPage').then((m) => ({ default: m.NewEntryPage })),
)

function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-t3" role="status">
      Loading…
    </div>
  )
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <CompanyCodePage />
      </ErrorBoundary>
    ),
  },
  {
    path: '/login',
    element: (
      <ErrorBoundary>
        <LoginPage />
      </ErrorBoundary>
    ),
  },
  {
    path: '/portal',
    element: (
      <ErrorBoundary>
        <ProspectPortalPage />
      </ErrorBoundary>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: 'dashboard',
            element: (
              <Lazy>
                <DashboardPage />
              </Lazy>
            ),
          },
          {
            path: 'workspace',
            element: (
              <Lazy>
                <WorkspacePage />
              </Lazy>
            ),
          },
          {
            path: 'pipeline',
            element: (
              <Lazy>
                <PipelinePage />
              </Lazy>
            ),
          },
          {
            path: 'roster',
            element: (
              <Lazy>
                <RosterPage />
              </Lazy>
            ),
          },
          {
            path: 'tasks',
            element: (
              <Lazy>
                <TasksPage />
              </Lazy>
            ),
          },
          {
            path: 'history',
            element: (
              <Lazy>
                <HistoryPage />
              </Lazy>
            ),
          },
          {
            path: 'reports',
            element: (
              <Lazy>
                <ReportsPage />
              </Lazy>
            ),
          },
          {
            path: 'applications',
            element: (
              <Lazy>
                <ApplicationsPage />
              </Lazy>
            ),
          },
          {
            path: 'new-entry',
            element: (
              <Lazy>
                <NewEntryPage />
              </Lazy>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
