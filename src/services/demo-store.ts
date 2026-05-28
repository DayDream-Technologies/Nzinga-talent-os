import type { ApplicationsMap, HistoryEntry, Talent, Task } from '@/types'
import {
  APPLICATIONS_SEED,
  HISTORY_SEED,
  TALENTS_SEED,
  TASKS_SEED,
} from '@/constants/seed-data'

let talents = structuredClone(TALENTS_SEED) as Talent[]
let tasks = structuredClone(TASKS_SEED) as Task[]
let history = structuredClone(HISTORY_SEED) as HistoryEntry[]
let applications = structuredClone(APPLICATIONS_SEED) as ApplicationsMap

export const demoStore = {
  getTalents: () => talents,
  setTalents: (next: Talent[]) => {
    talents = next
  },
  getTasks: () => tasks,
  setTasks: (next: Task[]) => {
    tasks = next
  },
  getHistory: () => history,
  setHistory: (next: HistoryEntry[]) => {
    history = next
  },
  getApplications: () => applications,
  setApplications: (next: ApplicationsMap) => {
    applications = next
  },
  reset: () => {
    talents = structuredClone(TALENTS_SEED)
    tasks = structuredClone(TASKS_SEED)
    history = structuredClone(HISTORY_SEED)
    applications = structuredClone(APPLICATIONS_SEED)
  },
}
