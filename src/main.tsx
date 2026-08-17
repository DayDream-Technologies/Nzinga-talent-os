import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { TalentAuthProvider } from '@/context/TalentAuthContext'
import { CompanyCodePage } from '@/pages/CompanyCodePage'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { EmailConfirmedPage } from '@/pages/EmailConfirmedPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { TalentLoginPage } from '@/pages/TalentLoginPage'
import { TalentHomePage } from '@/pages/TalentHomePage'
import { GuardianVerifyPage } from '@/pages/GuardianVerifyPage'
import { installChunkLoadRecovery, lazyWithReload } from '@/lib/lazy-with-reload'
import './index.css'
import './styles/animations.css'

installChunkLoadRecovery()

const ProtectedApp = lazyWithReload(() => import('@/components/ProtectedApp'))
const ProspectPortalPage = lazyWithReload(() =>
  import('@/pages/ProspectPortalPage').then((m) => ({ default: m.ProspectPortalPage })),
)

function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        fontSize: 14,
        color: '#6b7280',
      }}
    >
      Loading…
    </div>
  )
}

function TalentPortalLayout() {
  return (
    <TalentAuthProvider>
      <Outlet />
    </TalentAuthProvider>
  )
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/auth/confirmed', element: <EmailConfirmedPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/tmx', element: <CompanyCodePage /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/portal',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProspectPortalPage />
      </Suspense>
    ),
  },
  {
    path: '/guardian/verify',
    element: <GuardianVerifyPage />,
  },
  {
    path: '/talent',
    element: <TalentPortalLayout />,
    children: [
      { path: 'login', element: <TalentLoginPage /> },
      { path: 'home', element: <TalentHomePage /> },
    ],
  },
  {
    path: '/*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedApp />
      </Suspense>
    ),
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
