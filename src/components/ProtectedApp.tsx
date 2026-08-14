import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppDataProvider } from '@/context/AppDataContext'
import { AgencyDataProvider } from '@/context/AgencyDataContext'
import { AppShell } from '@/components/layout/AppShell'
import { canAccessAgencyPath } from '@/constants/agency-nav'
import type { Role } from '@/types'

const WorkspacePage = lazy(() => import('@/pages/WorkspacePage').then(m => ({ default: m.WorkspacePage })))
const AgencyModulePage = lazy(() => import('@/pages/AgencyModulePage').then(m => ({ default: m.AgencyModulePage })))
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage').then(m => ({ default: m.ApplicationsPage })))
const RosterPage = lazy(() => import('@/pages/RosterPage').then(m => ({ default: m.RosterPage })))
const AgencyReportsPage = lazy(() => import('@/pages/AgencyReportsPage').then(m => ({ default: m.AgencyReportsPage })))
const PipelinePage = lazy(() => import('@/pages/PipelinePage').then(m => ({ default: m.PipelinePage })))
const TalentAccountPage = lazy(() => import('@/pages/TalentAccountPage').then(m => ({ default: m.TalentAccountPage })))

function PageLoader() {
  return <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, fontSize: 14, color: '#6b7280' }}>Loading…</div>
}

function RoleRoute({ path, role, children }: { path: string; role: Role; children: ReactNode }) {
  if (!canAccessAgencyPath(role, path)) {
    return <Navigate to="/workspace" replace />
  }
  return <>{children}</>
}

export default function ProtectedApp() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/tmx" replace />

  return (
    <AppDataProvider>
      <AgencyDataProvider>
        <AppShell>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="workspace" element={<WorkspacePage />} />
              <Route
                path="applications"
                element={
                  <RoleRoute path="applications" role={user.role}>
                    <ApplicationsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="roster"
                element={
                  <RoleRoute path="roster" role={user.role}>
                    <RosterPage />
                  </RoleRoute>
                }
              />
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
                    <PipelinePage />
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
              <Route path=":moduleId" element={<AgencyModulePage />} />
              <Route path="*" element={<Navigate to="/workspace" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
      </AgencyDataProvider>
    </AppDataProvider>
  )
}
