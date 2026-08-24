import { Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppDataProvider } from '@/context/AppDataContext'
import { AgencyDataProvider } from '@/context/AgencyDataContext'
import { ToastProvider } from '@/components/ui/Toast'
import { AppShell } from '@/components/layout/AppShell'
import { SessionGate } from '@/components/auth/SessionGate'
import { canAccessAgencyPath } from '@/constants/agency-nav'
import { lazyWithReload } from '@/lib/lazy-with-reload'
import type { Role } from '@/types'

const WorkspacePage = lazyWithReload(() => import('@/pages/WorkspacePage').then(m => ({ default: m.WorkspacePage })))
const AgencyModulePage = lazyWithReload(() => import('@/pages/AgencyModulePage').then(m => ({ default: m.AgencyModulePage })))
const ApplicationsPage = lazyWithReload(() => import('@/pages/ApplicationsPage').then(m => ({ default: m.ApplicationsPage })))
const AgencyReportsPage = lazyWithReload(() => import('@/pages/AgencyReportsPage').then(m => ({ default: m.AgencyReportsPage })))
const PipelinePage = lazyWithReload(() => import('@/pages/PipelinePage').then(m => ({ default: m.PipelinePage })))
const TalentAccountPage = lazyWithReload(() => import('@/pages/TalentAccountPage').then(m => ({ default: m.TalentAccountPage })))
const AdminUsersPage = lazyWithReload(() => import('@/pages/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })))
const AdminInvitePage = lazyWithReload(() => import('@/pages/AdminInvitePage').then(m => ({ default: m.AdminInvitePage })))
const AdminRolesPage = lazyWithReload(() => import('@/pages/AdminRolesPage').then(m => ({ default: m.AdminRolesPage })))
const AdminAuditPage = lazyWithReload(() => import('@/pages/AdminAuditPage').then(m => ({ default: m.AdminAuditPage })))
const AdminSettingsPage = lazyWithReload(() => import('@/pages/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })))
const SettingsPage = lazyWithReload(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

function PageLoader() {
  return <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, fontSize: 14, color: '#6b7280' }}>Loading…</div>
}

function RoleRoute({ path, role, children }: { path: string; role: Role; children: ReactNode }) {
  if (!canAccessAgencyPath(role, path)) {
    return <Navigate to="/workspace" replace />
  }
  return <>{children}</>
}

/** Only mounts after SessionGate confirms a user — avoids reading user.role while restoring. */
function AuthenticatedApp() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <ToastProvider>
    <AppDataProvider>
      <AgencyDataProvider>
        <AppShell>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="workspace" element={<WorkspacePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route
                path="applications"
                element={
                  <RoleRoute path="applications" role={user.role}>
                    <ApplicationsPage />
                  </RoleRoute>
                }
              />
              <Route path="roster" element={<Navigate to="/clients" replace />} />
              <Route
                path="pipeline"
                element={
                  <RoleRoute path="pipeline" role={user.role}>
                    <PipelinePage />
                  </RoleRoute>
                }
              />
              <Route
                path="prospect-tracking"
                element={
                  <RoleRoute path="prospect-tracking" role={user.role}>
                    <AgencyModulePage />
                  </RoleRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <RoleRoute path="reports" role={user.role}>
                    <AgencyReportsPage />
                  </RoleRoute>
                }
              />
              <Route path="talent/:accountId" element={<TalentAccountPage />} />
              <Route
                path="admin/invite"
                element={
                  <RoleRoute path="admin/invite" role={user.role}>
                    <AdminInvitePage />
                  </RoleRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <RoleRoute path="admin/users" role={user.role}>
                    <AdminUsersPage />
                  </RoleRoute>
                }
              />
              <Route
                path="admin/roles"
                element={
                  <RoleRoute path="admin/roles" role={user.role}>
                    <AdminRolesPage />
                  </RoleRoute>
                }
              />
              <Route
                path="admin/audit-log"
                element={
                  <RoleRoute path="admin/audit-log" role={user.role}>
                    <AdminAuditPage />
                  </RoleRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <RoleRoute path="admin/settings" role={user.role}>
                    <AdminSettingsPage />
                  </RoleRoute>
                }
              />
              <Route path=":moduleId" element={<AgencyModulePage />} />
              <Route path="*" element={<Navigate to="/workspace" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
      </AgencyDataProvider>
    </AppDataProvider>
    </ToastProvider>
  )
}

export default function ProtectedApp() {
  return (
    <SessionGate>
      <AuthenticatedApp />
    </SessionGate>
  )
}
