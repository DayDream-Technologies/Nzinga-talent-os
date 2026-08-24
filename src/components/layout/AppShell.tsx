import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'
import { ApplicationReview } from '@/components/application/ApplicationModals'
import { TalentRecord } from '@/components/talent/TalentRecord'
import { TopNav, BreadcrumbBar, FullMenu, Sidebar } from '@/components/layout/Layout'
import { AGENCY_PAGE_TITLES } from '@/constants/agency-nav'
import { T } from '@/lib/tokens'
import { ApplicationProspectSync } from '@/components/agency/ApplicationProspectSync'
import { useSidebarPreference } from '@/hooks/useSidebarPreference'

export function AppShell({ children }: { children?: React.ReactNode }) {
  const { user, companyCode, switchUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const view = location.pathname.replace(/^\//, '') || 'workspace'
  const { sidebarVisible } = useSidebarPreference()

  const {
    talents,
    tasks,
    history,
    applications,
    selectedTalent,
    setSelectedTalent,
    reviewingApp,
    setReviewingApp,
    updateTalent,
    setTasks,
    setHistory,
    handleSendApp,
    importAppToPipeline,
    refreshAll,
  } = useAppData()

  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (location.pathname.startsWith('/talent/')) setSelectedTalent(null)
  }, [location.pathname, setSelectedTalent])

  if (!user) return null

  const pageTitle = view.startsWith('talent/')
    ? 'Talent Account'
    : AGENCY_PAGE_TITLES[view] || view

  function nav(path: string) {
    if (path.includes('?')) {
      const [pathname, search] = path.split('?')
      navigate({ pathname: `/${pathname}`, search: `?${search}` })
    } else {
      navigate(`/${path}`)
    }
  }

  function handleLogout(switchTo?: typeof user) {
    if (switchTo) {
      switchUser(switchTo)
    } else {
      void logout()
      navigate('/tmx')
    }
  }

  const currentTalent =
    selectedTalent && talents.find((t) => t.id === selectedTalent.id)
      ? talents.find((t) => t.id === selectedTalent.id)!
      : selectedTalent

  return (
    <div
      className="flex h-screen flex-col overflow-hidden text-[13px] text-t1"
      style={{ fontFamily: "'Outfit','Segoe UI',system-ui,sans-serif", background: T.pageBg }}
    >
      <TopNav
        user={user}
        companyCode={companyCode}
        onMenu={() => setMenuOpen(true)}
        onLogout={handleLogout}
        onNav={nav}
        talents={talents}
        onSelectTalent={setSelectedTalent}
        tasks={tasks}
      />
      <BreadcrumbBar label={pageTitle} sub={undefined} />
      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && <Sidebar view={view} onNav={nav} userRole={user.role} />}
        <div key={view} className="flex flex-1 flex-col overflow-hidden animate-fade-in">
          {children ?? <Outlet />}
        </div>
      </div>
      <ApplicationProspectSync />
      {menuOpen && (
        <FullMenu
          onClose={() => setMenuOpen(false)}
          onNav={(v: string) => {
            nav(v)
            setMenuOpen(false)
          }}
          userRole={user.role}
          companyCode={companyCode}
        />
      )}
      {reviewingApp && (
        <ApplicationReview
          app={reviewingApp}
          onClose={() => setReviewingApp(null)}
          onImportToPipeline={() => importAppToPipeline(reviewingApp)}
        />
      )}
      {currentTalent && (
        <TalentRecord
          talent={currentTalent}
          currentUser={user}
          allHistory={history}
          setHistory={setHistory}
          allTasks={tasks}
          setTasks={setTasks}
          applications={applications}
          onClose={() => setSelectedTalent(null)}
          onUpdate={async (u: import('@/types').Talent) => {
            await updateTalent(u)
          }}
          onSendApp={handleSendApp}
          refreshAll={refreshAll}
        />
      )}
    </div>
  )
}
