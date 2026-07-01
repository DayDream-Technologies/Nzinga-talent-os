import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { AppDataProvider } from '@/context/AppDataContext'
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
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const TrainingPage = lazy(() =>
  import('@/pages/TrainingPage').then((m) => ({ default: m.TrainingPage })),
)
const AdminUsersPage = lazy(() =>
  import('@/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminRolesPage = lazy(() =>
  import('@/pages/AdminRolesPage').then((m) => ({ default: m.AdminRolesPage })),
)
const AdminAuditPage = lazy(() =>
  import('@/pages/AdminAuditPage').then((m) => ({ default: m.AdminAuditPage })),
)
const AdminSettingsPage = lazy(() =>
  import('@/pages/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })),
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
        <AppDataProvider>
          <ProspectPortalPage />
        </AppDataProvider>
      </ErrorBoundary>
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
            path: 'training',
            element: (
              <Lazy>
                <TrainingPage />
              </Lazy>
            ),
          },
          {
            element: <RoleGuard allowedRoles={['scout', 'director']} />,
            children: [
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
          {
            element: <RoleGuard allowedRoles={['director']} />,
            children: [
              {
                path: 'admin/users',
                element: (
                  <Lazy>
                    <AdminUsersPage />
                  </Lazy>
                ),
              },
              {
                path: 'admin/roles',
                element: (
                  <Lazy>
                    <AdminRolesPage />
                  </Lazy>
                ),
              },
              {
                path: 'admin/audit-log',
                element: (
                  <Lazy>
                    <AdminAuditPage />
                  </Lazy>
                ),
              },
              {
                path: 'admin/settings',
                element: (
                  <Lazy>
                    <AdminSettingsPage />
                  </Lazy>
                ),
              },
            ],
          },
          {
            path: 'settings',
            element: (
              <Lazy>
                <SettingsPage />
              </Lazy>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
