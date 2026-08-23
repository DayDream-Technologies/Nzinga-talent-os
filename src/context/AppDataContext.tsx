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
import { applyApplicationToTalent, isAppComplete, talentFromApp } from '@/constants/app-sections'
import { assignAccountNumber, nextAccountNumber } from '@/lib/account-number'
import { fetchTalents, updateTalents, upsertTalent } from '@/services/talent.service'
import { fetchApplications, saveApplication } from '@/services/application.service'
import { fetchTasks, saveTasks } from '@/services/task.service'
import { fetchHistory, saveHistory } from '@/services/history.service'
import { useAuthContext } from './AuthContext'
import { supabaseConfigured } from '@/lib/supabase'

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

function withAccountNumber(talent: Talent, existing: Talent[]): Talent {
  return assignAccountNumber(
    talent,
    existing.map((t) => t.account_number),
  )
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null)
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null)
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null)
  const [localHistory, setLocalHistory] = useState<HistoryEntry[] | null>(null)

  const queryEnabled = !supabaseConfigured || !!user

  const talentsQuery = useQuery({ queryKey: ['talents'], queryFn: fetchTalents, enabled: queryEnabled })
  const appsQuery = useQuery({ queryKey: ['applications'], queryFn: fetchApplications, enabled: queryEnabled })
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks, enabled: queryEnabled })
  const historyQuery = useQuery({ queryKey: ['history'], queryFn: fetchHistory, enabled: queryEnabled })

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
        try {
        let saved = app
        try {
          saved = await saveApplication(app)
        } catch (e) {
          console.warn('[saveApp] Supabase save failed:', e)
          return
        }
        const apps = { ...applicationsRef.current, [saved.id]: saved }
        queryClient.setQueryData(['applications'], apps)

        const appAlreadyLinked = talentsRef.current.find((t) => t.application_id === app.id)

        if (
          !appAlreadyLinked &&
          (app.status === 'in_progress' || app.status === 'sent')
        ) {
          const stub = {
            ...talentFromApp(saved, nextAccountNumber(talentsRef.current.map((t) => t.account_number))),
            id: 't_stub_' + app.id,
            stage: 'holding_entry' as const,
            application_id: app.id,
            application_status: saved.status,
            audit_log: [
              {
                user: saved.talent_name,
                role: 'Prospect',
                action: 'Started application — profile auto-created from questionnaire',
                stage: 'holding_entry',
                ts: new Date().toISOString(),
              },
            ],
          }
          try {
            await persistTalents([...talentsRef.current, stub])
            await saveApplication({ ...saved, talent_id: stub.id })
          } catch (e) {
            console.warn('[saveApp] Talent stub persist failed:', e)
          }
          return
        }

        if (appAlreadyLinked) {
          const next = talentsRef.current.map((t) =>
            t.application_id === app.id ? applyApplicationToTalent(t, saved) : t,
          )
          try {
            await persistTalents(next)
          } catch (e) {
            console.warn('[saveApp] Talent update from application failed:', e)
          }
        }

        // Minor submitted — keep holding stub with pending parent approval (do not upgrade to full lead yet)
        if (app.status === 'pending_guardian') {
          const existing = talentsRef.current.find((t) => t.application_id === app.id)
          if (existing) {
            const next = talentsRef.current.map((t) =>
              t.id === existing.id ? { ...t, application_status: 'pending_guardian' } : t,
            )
            await persistTalents(next)
          }
        }

        if (app.status === 'submitted' && isAppComplete(app) && app.guardian_status !== 'pending') {
          const existingFull = talentsRef.current.find((t) => t.application_id === app.id)
          if (existingFull) {
            const fullTalent = talentFromApp(
              { ...app, id: app.id },
              existingFull.account_number,
            )
            const upgraded: Talent = {
              ...existingFull,
              ...fullTalent,
              id: existingFull.id,
              application_id: app.id,
              application_status: 'submitted',
            }
            try {
              await upsertTalent(upgraded)
              const next = talentsRef.current.map((t) =>
                t.id === existingFull.id ? upgraded : t,
              )
              await persistTalents(next)
            } catch (e) {
              console.warn('[saveApp] Talent upgrade on submit failed:', e)
            }
            const hist: HistoryEntry = {
              id: 'h' + Date.now(),
              talent_id: existingFull.id,
              user_id: null,
              type: 'system',
              text: 'Application submitted and 100% complete — profile upgraded as New / Lead.',
              ts: new Date().toISOString(),
              flagged: false,
              is_document: false,
            }
            const newHist = [hist, ...history]
            setLocalHistory(newHist)
            await saveHistory([hist])
          } else {
            const newTalent = talentFromApp(
              app,
              nextAccountNumber(talentsRef.current.map((t) => t.account_number)),
            )
            await persistTalents([...talentsRef.current, newTalent])
            await saveApplication({ ...app, talent_id: newTalent.id })
            const hist: HistoryEntry = {
              id: 'h' + Date.now(),
              talent_id: newTalent.id,
              user_id: null,
              type: 'system',
              text: 'Application auto-imported to New / Lead.',
              ts: new Date().toISOString(),
              flagged: false,
              is_document: false,
            }
            const newHist = [hist, ...history]
            setLocalHistory(newHist)
            await saveHistory([hist])
          }
        }
        } catch (e) {
          console.warn('[saveApp] failed:', e)
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
          const upgraded = {
            ...existing,
            ...talentFromApp(app, existing.account_number),
            id: existing.id,
            account_number: existing.account_number,
          }
          await upsertTalent(upgraded)
          await persistTalents(
            talentsRef.current.map((t) => (t.id === existing.id ? upgraded : t)),
          )
        } else {
          const newTalent = talentFromApp(
            app,
            nextAccountNumber(talentsRef.current.map((t) => t.account_number)),
          )
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
      void persistTalents([...talentsRef.current, withAccountNumber(t, talentsRef.current)])
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
      const prevById = new Map(history.map((h) => [h.id, h]))
      const changed = next.filter((h) => JSON.stringify(prevById.get(h.id)) !== JSON.stringify(h))
      setLocalHistory(next)
      queryClient.setQueryData(['history'], next)
      if (changed.length === 0) return
      void saveHistory(changed).catch((err) => {
        console.error('[history] persist failed', err)
      })
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
