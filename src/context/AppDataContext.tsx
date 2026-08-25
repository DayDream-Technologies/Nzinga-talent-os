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
import { SOP_STATUS } from '@/constants/sop-status'
import {
  findLinkedTalent,
  isApplicationReadyToImport,
} from '@/lib/application-prefill'
import { assignAccountNumber, nextAccountNumber } from '@/lib/account-number'
import { fetchTalents, updateTalents, upsertTalent } from '@/services/talent.service'
import { fetchApplications, saveApplication } from '@/services/application.service'
import { fetchTasks, saveTasks } from '@/services/task.service'
import { fetchHistory, saveHistory } from '@/services/history.service'
import { useAuthContext } from './AuthContext'
import { supabaseConfigured } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { persistErrorMessage } from '@/lib/persist-error'

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
  updateTalent: (t: Talent) => Promise<void>
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>
  saveApp: (app: Application) => void
  handleSendApp: (app: Application, opts?: { accountNumber?: string }) => void
  importAppToPipeline: (app: Application) => Promise<Talent | null>
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
  const { showToast } = useToast()
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
      try {
        await persistTalents(next)
        if (selectedTalent?.id === t.id) setSelectedTalent(t)
      } catch (e) {
        showToast(persistErrorMessage(e), 'error')
        throw e
      }
    },
    [persistTalents, selectedTalent?.id, showToast],
  )

  const saveApp = useCallback(
    (app: Application) => {
      void (async () => {
        try {
        let saved = app
        try {
          saved = await saveApplication(app)
        } catch (e) {
          showToast(persistErrorMessage(e), 'error')
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
            showToast(persistErrorMessage(e), 'error')
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
            showToast(persistErrorMessage(e), 'error')
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
            const upgraded: Talent = applyApplicationToTalent(existingFull, saved)
            try {
              await upsertTalent(upgraded)
              const next = talentsRef.current.map((t) =>
                t.id === existingFull.id ? upgraded : t,
              )
              await persistTalents(next)
            } catch (e) {
              showToast(persistErrorMessage(e), 'error')
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
          showToast(persistErrorMessage(e), 'error')
        }
      })()
    },
    [queryClient, persistTalents, history, showToast],
  )

  const handleSendApp = useCallback(
    (app: Application, opts?: { accountNumber?: string }) => {
      void (async () => {
        try {
          const saved = await saveApplication(app)
          queryClient.setQueryData(['applications'], {
            ...applicationsRef.current,
            [saved.id]: saved,
          })
          const existing = findLinkedTalent(talentsRef.current, saved)
          if (existing) {
            const next = talentsRef.current.map((t) =>
              t.id === existing.id
                ? { ...t, application_id: saved.id, application_status: saved.status }
                : t,
            )
            await persistTalents(next)
            if (saved.talent_id !== existing.id) {
              const linked = await saveApplication({ ...saved, talent_id: existing.id })
              queryClient.setQueryData(['applications'], {
                ...applicationsRef.current,
                [linked.id]: linked,
              })
            }
            return
          }
          const stub = {
            ...talentFromApp(
              saved,
              opts?.accountNumber ||
                nextAccountNumber(talentsRef.current.map((t) => t.account_number)),
            ),
            id: `t_stub_${saved.id}`,
            stage: 'holding_entry' as const,
            application_id: saved.id,
            application_status: saved.status,
            applicant_stage_status: 'New / Lead',
            audit_log: [
              {
                user: saved.talent_name,
                role: 'Prospect',
                action: 'Application invitation sent — profile created from known information',
                stage: 'holding_entry',
                ts: new Date().toISOString(),
              },
            ],
          }
          await persistTalents([...talentsRef.current, stub])
          const linked = await saveApplication({ ...saved, talent_id: stub.id })
          queryClient.setQueryData(['applications'], {
            ...applicationsRef.current,
            [linked.id]: linked,
          })
        } catch (e) {
          showToast(persistErrorMessage(e), 'error')
        }
      })()
    },
    [queryClient, persistTalents, showToast],
  )

  const importAppToPipeline = useCallback(
    async (app: Application): Promise<Talent | null> => {
      if (!isApplicationReadyToImport(app)) {
        showToast(
          app.status === 'pending_guardian' || app.guardian_status === 'pending'
            ? 'Cannot import until parent/guardian approval is complete.'
            : 'Application must be submitted and complete before importing to pipeline.',
          'error',
        )
        return null
      }
      try {
        const existing = findLinkedTalent(talentsRef.current, app)
        const imported: Talent = existing
          ? {
              ...applyApplicationToTalent(existing, app),
              id: existing.id,
              account_number: existing.account_number,
              stage: existing.stage,
            }
          : talentFromApp(
              app,
              nextAccountNumber(talentsRef.current.map((t) => t.account_number)),
            )
        if (existing) {
          await upsertTalent(imported)
          await persistTalents(
            talentsRef.current.map((t) => (t.id === existing.id ? imported : t)),
          )
        } else {
          await persistTalents([...talentsRef.current, imported])
        }
        if (app.talent_id !== imported.id) {
          const linked = await saveApplication({ ...app, talent_id: imported.id })
          queryClient.setQueryData(['applications'], {
            ...applicationsRef.current,
            [linked.id]: linked,
          })
        }
        const hist: HistoryEntry = {
          id: 'h' + Date.now(),
          talent_id: imported.id,
          account_number: imported.account_number || null,
          user_id: null,
          type: 'system',
          text: `Imported to pipeline as ${SOP_STATUS.underVetting}.`,
          ts: new Date().toISOString(),
          flagged: false,
          is_document: false,
        }
        const newHist = [hist, ...history]
        setLocalHistory(newHist)
        await saveHistory([hist])
        setReviewingApp(null)
        setSelectedTalent(imported)
        showToast(`Imported to pipeline as ${SOP_STATUS.underVetting}.`, 'success')
        return imported
      } catch (e) {
        showToast(persistErrorMessage(e), 'error')
        return null
      }
    },
    [persistTalents, queryClient, history, showToast],
  )

  const handleNewTalent = useCallback(
    (t: Talent) => {
      void persistTalents([...talentsRef.current, withAccountNumber(t, talentsRef.current)]).catch(
        (e) => showToast(persistErrorMessage(e), 'error'),
      )
    },
    [persistTalents, showToast],
  )

  const setTasks = useCallback(
    (updater: React.SetStateAction<Task[]>) => {
      const prev = tasks
      const next = typeof updater === 'function' ? updater(tasks) : updater
      setLocalTasks(next)
      queryClient.setQueryData(['tasks'], next)
      void saveTasks(next).catch((err) => {
        setLocalTasks(prev)
        queryClient.setQueryData(['tasks'], prev)
        showToast(persistErrorMessage(err), 'error')
      })
    },
    [tasks, queryClient, showToast],
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
        setLocalHistory(history)
        queryClient.setQueryData(['history'], history)
        showToast(persistErrorMessage(err), 'error')
      })
    },
    [history, queryClient, showToast],
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
