import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'
import { ApplicationReview } from '@/components/application/ApplicationModals'
import { TalentRecord } from '@/components/talent/TalentRecord'
import { InviteUserModal } from '@/components/admin/InviteUserModal'
import { TopNav, BreadcrumbBar, Scoreboard, FullMenu, Sidebar } from '@/components/layout/Layout'
import { T } from '@/lib/tokens'

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  workspace: 'My Workspace',
  pipeline: 'Pipeline',
  roster: 'Full Roster',
  tasks: 'Tasks',
  history: 'History / Notes',
  reports: 'Reports',
  'new-entry': 'New Holding Entry',
  applications: 'Applications',
  settings: 'Settings',
}

export function AppShell({ children }: { children?: React.ReactNode }) {
  const { user, companyCode, switchUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const view = location.pathname.replace(/^\//, '') || 'dashboard'

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
  } = useAppData()

  const [menuOpen, setMenuOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  if (!user) return null

  const pageTitle = PAGE_TITLES[view] || view

  function nav(path: string) {
    navigate(`/${path}`)
  }

  function handleLogout(switchTo?: typeof user) {
    if (switchTo) {
      switchUser(switchTo)
    } else {
      void logout()
      navigate('/')
    }
  }

  const currentTalent =
    selectedTalent && talents.find((t) => t.id === selectedTalent.id)
      ? talents.find((t) => t.id === selectedTalent.id)!
      : selectedTalent

  return (
    <div
      className="flex h-screen flex-col overflow-hidden text-[13px] text-t1"
      style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", background: T.pageBg }}
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
      {user.role === 'director' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px 4px', background: T.pageBg }}>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            style={{ fontSize: 11, fontWeight: 600, color: T.purple, background: 'rgba(124,58,237,0.08)', border: `1px solid rgba(124,58,237,0.2)`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Invite Team Member
          </button>
        </div>
      )}
      <Scoreboard talents={talents} role={user.role} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          view={view}
          onNav={nav}
          talents={talents}
          tasks={tasks}
          currentUser={user}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          {children ?? <Outlet />}
        </div>
      </div>
      {menuOpen && (
        <FullMenu
          onClose={() => setMenuOpen(false)}
          onNav={(v: string) => {
            nav(v)
            setMenuOpen(false)
          }}
          userRole={user.role}
        />
      )}
      {reviewingApp && (
        <ApplicationReview
          app={reviewingApp}
          onClose={() => setReviewingApp(null)}
          onImportToPipeline={() => importAppToPipeline(reviewingApp)}
        />
      )}
      {inviteOpen && (
        <InviteUserModal
          onClose={() => setInviteOpen(false)}
          onSuccess={() => setInviteOpen(false)}
        />
      )}
      {currentTalent && (
        <TalentRecord
          talent={currentTalent}
          talents={talents}
          currentUser={user}
          allHistory={history}
          setHistory={setHistory}
          allTasks={tasks}
          setTasks={setTasks}
          applications={applications}
          onClose={() => setSelectedTalent(null)}
          onUpdate={(u: import('@/types').Talent) => {
            void updateTalent(u)
            setSelectedTalent(u)
          }}
          onSendApp={handleSendApp}
        />
      )}
    </div>
  )
}
