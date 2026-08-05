import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'
import { useAgencyData } from '@/context/AgencyDataContext'
import { ApplicationReview } from '@/components/application/ApplicationModals'
import { TalentRecord } from '@/components/talent/TalentRecord'
import { InviteUserModal } from '@/components/admin/InviteUserModal'
import { TopNav, BreadcrumbBar, Scoreboard, FullMenu, Sidebar } from '@/components/layout/Layout'
import { AGENCY_PAGE_TITLES } from '@/constants/agency-nav'
import { T } from '@/lib/tokens'

export function AppShell({ children }: { children?: React.ReactNode }) {
  const { user, companyCode, switchUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const view = location.pathname.replace(/^\//, '') || 'workspace'

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

  const agency = useAgencyData()

  const [menuOpen, setMenuOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const agencyStats = useMemo(
    () => [
      {
        label: 'Open Tickets',
        value: agency.tickets.filter((t) => t.status !== 'resolved').length,
        color: T.amber,
      },
      {
        label: 'Agency Tasks',
        value: agency.tasks.filter((t) => t.status === 'open').length,
        color: T.blue,
      },
      {
        label: 'Open Invoices',
        value: agency.invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').length,
        color: T.purple,
      },
      {
        label: 'Pending Payouts',
        value: agency.expenseLogs.filter((e) => e.status === 'pending').length,
        color: T.green,
      },
      {
        label: 'Active Roster',
        value: agency.talent.filter((t) => t.status === 'active').length,
        color: T.cyan,
      },
    ],
    [agency.tickets, agency.tasks, agency.invoices, agency.expenseLogs, agency.talent],
  )

  if (!user) return null

  const pageTitle = AGENCY_PAGE_TITLES[view] || view

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
      <Scoreboard agencyStats={agencyStats} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar view={view} onNav={nav} />
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
          refreshAll={refreshAll}
        />
      )}
    </div>
  )
}
