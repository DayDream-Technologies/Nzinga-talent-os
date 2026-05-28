import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { CompanyCodePage } from '@/pages/CompanyCodePage'
import { LoginPage } from '@/pages/LoginPage'
import './index.css'

const ProtectedApp = lazy(() => import('@/components/ProtectedApp'))
const ProspectPortalPage = lazy(() => import('@/pages/ProspectPortalPage').then(m => ({ default: m.ProspectPortalPage })))

function PageLoader() {
  return <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, fontSize: 14, color: '#6b7280' }}>Loading…</div>
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

const router = createBrowserRouter([
  { path: '/', element: <CompanyCodePage /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/portal',
    element: <Suspense fallback={<PageLoader />}><ProspectPortalPage /></Suspense>,
  },
  {
    path: '/*',
    element: <Suspense fallback={<PageLoader />}><ProtectedApp /></Suspense>,
  },
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
