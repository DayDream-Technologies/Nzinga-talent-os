import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppDataProvider } from '@/context/AppDataContext'
import { AgencyDataProvider } from '@/context/AgencyDataContext'
import { AppShell } from '@/components/layout/AppShell'

const WorkspacePage = lazy(() => import('@/pages/WorkspacePage').then(m => ({ default: m.WorkspacePage })))
const AgencyModulePage = lazy(() => import('@/pages/AgencyModulePage').then(m => ({ default: m.AgencyModulePage })))

function PageLoader() {
  return <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, fontSize: 14, color: '#6b7280' }}>Loading…</div>
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
              <Route path=":moduleId" element={<AgencyModulePage />} />
              <Route path="*" element={<Navigate to="/workspace" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
      </AgencyDataProvider>
    </AppDataProvider>
  )
}
