import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Application, ApplicationsMap, HistoryEntry, Talent, Task } from '@/types'
import { isAppComplete, talentFromApp } from '@/constants/app-sections'
import { fetchTalents, updateTalents, upsertTalent } from '@/services/talent.service'
import { fetchApplications, saveApplication } from '@/services/application.service'
import { fetchTasks, saveTasks } from '@/services/task.service'
import { fetchHistory, saveHistory } from '@/services/history.service'

interface AppDataContextValue {
  talents: Talent[]
  tasks: Task[]
  history: HistoryEntry[]
  applications: ApplicationsMap
  isLoading: boolean
  selectedTalent: Talent | null
  setSelectedTalent: (t: Talent | null) => void
  reviewingApp: Application | null
  setReviewingApp: (a: Application | null) => void
  updateTalent: (t: Talent) => void
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>
  saveApp: (app: Application) => void
  handleSendApp: (app: Application) => void
  importAppToPipeline: (app: Application) => void
  handleNewTalent: (t: Talent) => void
  refreshAll: () => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null)
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null)
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null)
  const [localHistory, setLocalHistory] = useState<HistoryEntry[] | null>(null)

  const talentsQuery = useQuery({ queryKey: ['talents'], queryFn: fetchTalents })
  const appsQuery = useQuery({ queryKey: ['applications'], queryFn: fetchApplications })
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })
  const historyQuery = useQuery({ queryKey: ['history'], queryFn: fetchHistory })

  const talents = talentsQuery.data ?? []
  const applications = appsQuery.data ?? {}
  const tasks = localTasks ?? tasksQuery.data ?? []
  const history = localHistory ?? historyQuery.data ?? []

  const talentsRef = useRef(talents)
  const applicationsRef = useRef(applications)
  useEffect(() => {
    talentsRef.current = talents
  }, [talents])
  useEffect(() => {
    applicationsRef.current = applications
  }, [applications])

  const persistTalents = useCallback(
    async (next: Talent[]) => {
      await updateTalents(next)
      queryClient.setQueryData(['talents'], next)
    },
    [queryClient],
  )

  const updateTalent = useCallback(
    async (t: Talent) => {
      const next = talentsRef.current.map((x) => (x.id === t.id ? t : x))
      await persistTalents(next)
      if (selectedTalent?.id === t.id) setSelectedTalent(t)
    },
    [persistTalents, selectedTalent?.id],
  )

  const saveApp = useCallback(
    (app: Application) => {
      void (async () => {
        await saveApplication(app)
        const apps = { ...applicationsRef.current, [app.id]: app }
        queryClient.setQueryData(['applications'], apps)

        const appAlreadyLinked = talentsRef.current.find((t) => t.application_id === app.id)

        if (
          !appAlreadyLinked &&
          (app.status === 'in_progress' || app.status === 'sent')
        ) {
          const stub: Talent = {
            id: 't_stub_' + app.id,
            name: app.talent_name,
            stage: 'holding_entry',
            niches: [],
            scout_id: null,
            created_at: app.created_at || new Date().toISOString(),
            social_handle: '',
            follower_count: '',
            er_pct: '',
            platform: '',
            location: '',
            pillar_scores: [0, 0, 0, 0, 0],
            pillar_rationales: ['', '', '', '', ''],
            jordan_score: 0,
            revenue_path: '',
            scout_summary: '',
            team1_notes: '',
            team1_decision: null,
            compliance: {},
            rep_type: '',
            commission: '',
            term_length: '',
            team2_notes: '',
            team2_decision: null,
            director_decision: null,
            portal_setup: false,
            technical_routing: false,
            warm_handoff: '',
            warm_handoff_confirmed: false,
            revenue_ytd: '0',
            revenue_projected: '0',
            last_contacted: new Date().toISOString().split('T')[0],
            application_id: app.id,
            application_status: 'in_progress',
            uploaded_docs: {},
            audit_log: [
              {
                user: app.talent_name,
                role: 'Prospect',
                action: 'Started application — stub profile auto-created',
                stage: 'holding_entry',
                ts: new Date().toISOString(),
              },
            ],
          }
          await persistTalents([...talentsRef.current, stub])
          await saveApplication({ ...app, talent_id: stub.id })
          return
        }

        if (appAlreadyLinked) {
          const next = talentsRef.current.map((t) =>
            t.application_id === app.id ? { ...t, application_status: app.status } : t,
          )
          await persistTalents(next)
        }

        if (app.status === 'submitted' && isAppComplete(app)) {
          const existingFull = talentsRef.current.find((t) => t.application_id === app.id)
          if (existingFull) {
            const fullTalent = talentFromApp({ ...app, id: app.id })
            const upgraded: Talent = {
              ...existingFull,
              ...fullTalent,
              id: existingFull.id,
              application_id: app.id,
              application_status: 'submitted',
            }
            await upsertTalent(upgraded)
            const next = talentsRef.current.map((t) =>
              t.id === existingFull.id ? upgraded : t,
            )
            await persistTalents(next)
            const hist: HistoryEntry = {
              id: 'h' + Date.now(),
              talent_id: existingFull.id,
              user_id: null,
              type: 'system',
              text: 'Application submitted and 100% complete — profile upgraded and entered main pipeline.',
              ts: new Date().toISOString(),
              flagged: false,
              is_document: false,
            }
            const newHist = [hist, ...history]
            setLocalHistory(newHist)
            await saveHistory(newHist)
          } else {
            const newTalent = talentFromApp(app)
            await persistTalents([...talentsRef.current, newTalent])
            await saveApplication({ ...app, talent_id: newTalent.id })
            const hist: HistoryEntry = {
              id: 'h' + Date.now(),
              talent_id: newTalent.id,
              user_id: null,
              type: 'system',
              text: 'Application auto-imported to Holding Entry pipeline.',
              ts: new Date().toISOString(),
              flagged: false,
              is_document: false,
            }
            const newHist = [hist, ...history]
            setLocalHistory(newHist)
            await saveHistory(newHist)
          }
        }
      })()
    },
    [queryClient, persistTalents, history],
  )

  const handleSendApp = useCallback(
    (app: Application) => {
      void (async () => {
        await saveApplication(app)
        queryClient.setQueryData(['applications'], {
          ...applicationsRef.current,
          [app.id]: app,
        })
        if (app.talent_id) {
          const next = talentsRef.current.map((t) =>
            t.id === app.talent_id
              ? { ...t, application_id: app.id, application_status: 'sent' }
              : t,
          )
          await persistTalents(next)
        }
      })()
    },
    [queryClient, persistTalents],
  )

  const importAppToPipeline = useCallback(
    (app: Application) => {
      if (!isAppComplete(app)) return
      void (async () => {
        const existing = talentsRef.current.find((t) => t.application_id === app.id)
        if (existing) {
          const upgraded = { ...existing, ...talentFromApp(app), id: existing.id }
          await upsertTalent(upgraded)
          await persistTalents(
            talentsRef.current.map((t) => (t.id === existing.id ? upgraded : t)),
          )
        } else {
          const newTalent = talentFromApp(app)
          await persistTalents([...talentsRef.current, newTalent])
          await saveApplication({ ...app, talent_id: newTalent.id })
        }
        setReviewingApp(null)
      })()
    },
    [persistTalents],
  )

  const handleNewTalent = useCallback(
    (t: Talent) => {
      void persistTalents([...talentsRef.current, t])
    },
    [persistTalents],
  )

  const setTasks = useCallback(
    (updater: React.SetStateAction<Task[]>) => {
      const next = typeof updater === 'function' ? updater(tasks) : updater
      setLocalTasks(next)
      void saveTasks(next)
      queryClient.setQueryData(['tasks'], next)
    },
    [tasks, queryClient],
  )

  const setHistoryState = useCallback(
    (updater: React.SetStateAction<HistoryEntry[]>) => {
      const next = typeof updater === 'function' ? updater(history) : updater
      setLocalHistory(next)
      void saveHistory(next)
      queryClient.setQueryData(['history'], next)
    },
    [history, queryClient],
  )

  const refreshAll = useCallback(() => {
    void queryClient.invalidateQueries()
  }, [queryClient])

  const value = useMemo(
    () => ({
      talents,
      tasks,
      history,
      applications,
      isLoading:
        talentsQuery.isLoading ||
        appsQuery.isLoading ||
        tasksQuery.isLoading ||
        historyQuery.isLoading,
      selectedTalent,
      setSelectedTalent,
      reviewingApp,
      setReviewingApp,
      updateTalent,
      setTasks,
      setHistory: setHistoryState,
      saveApp,
      handleSendApp,
      importAppToPipeline,
      handleNewTalent,
      refreshAll,
    }),
    [
      talents,
      tasks,
      history,
      applications,
      talentsQuery.isLoading,
      appsQuery.isLoading,
      tasksQuery.isLoading,
      historyQuery.isLoading,
      selectedTalent,
      reviewingApp,
      updateTalent,
      setTasks,
      setHistoryState,
      saveApp,
      handleSendApp,
      importAppToPipeline,
      handleNewTalent,
      refreshAll,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
