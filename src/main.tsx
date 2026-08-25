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
import { TalentActivityPage } from '@/pages/TalentActivityPage'
import { TalentMoneyPage } from '@/pages/TalentMoneyPage'
import { TalentFilesPage } from '@/pages/TalentFilesPage'
import { TalentMessagesPage } from '@/pages/TalentMessagesPage'
import { TalentAppLayout } from '@/components/talent-portal/TalentPortalShell'
import { GuardianVerifyPage } from '@/pages/GuardianVerifyPage'
import { installChunkLoadRecovery, lazyWithReload } from '@/lib/lazy-with-reload'
import { readStorage, STORAGE_THEME } from '@/lib/session-storage'
import { applyTheme } from '@/lib/user-settings'
import './index.css'
import './styles/animations.css'

installChunkLoadRecovery()

try {
  const theme = readStorage(STORAGE_THEME)
  if (theme === 'dark' || theme === 'light') applyTheme(theme)
} catch {
  /* ignore */
}

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

function RootLayout() {
  return <Outlet />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'auth/confirmed', element: <EmailConfirmedPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'tmx', element: <CompanyCodePage /> },
      { path: 'login', element: <LoginPage /> },
      {
        path: 'portal',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProspectPortalPage />
          </Suspense>
        ),
      },
      { path: 'guardian/verify', element: <GuardianVerifyPage /> },
      {
        path: 'talent',
        element: <TalentPortalLayout />,
        children: [
          { path: 'login', element: <TalentLoginPage /> },
          {
            element: <TalentAppLayout />,
            children: [
              { path: 'home', element: <TalentHomePage /> },
              { path: 'activity', element: <TalentActivityPage /> },
              { path: 'money', element: <TalentMoneyPage /> },
              { path: 'files', element: <TalentFilesPage /> },
              { path: 'messages', element: <TalentMessagesPage /> },
            ],
          },
        ],
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProtectedApp />
          </Suspense>
        ),
      },
    ],
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
