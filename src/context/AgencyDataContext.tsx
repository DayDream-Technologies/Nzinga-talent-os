import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  AGENCY_CLIENTS_SEED,
  AGENCY_PROSPECTS_SEED,
  AGENCY_TALENT_SEED,
  AGENCY_TASKS_SEED,
  APPOINTMENTS_SEED,
  CALENDAR_EVENTS_SEED,
  DISBURSEMENTS_SEED,
  ESCROW_SEED,
  EXPENSE_LOGS_SEED,
  INVOICES_SEED,
  MESSAGES_SEED,
  PROJECT_SCENARIO,
  RETAINER_PLANS_SEED,
  SUPPORT_TICKETS_SEED,
  VENDORS_SEED,
} from '@/constants/agency-seed'
import type {
  AgencyClient,
  AgencyProspect,
  AgencyTalent,
  AgencyTask,
  Appointment,
  CalendarEvent,
  ClientInvoice,
  Disbursement,
  EscrowDeposit,
  ExpensePayoutLog,
  MessageThread,
  RetainerPlan,
  SupportTicket,
  Vendor,
} from '@/types/agency'

interface AgencyDataValue {
  clients: AgencyClient[]
  talent: AgencyTalent[]
  prospects: AgencyProspect[]
  tickets: SupportTicket[]
  tasks: AgencyTask[]
  appointments: Appointment[]
  calendar: CalendarEvent[]
  invoices: ClientInvoice[]
  retainers: RetainerPlan[]
  escrow: EscrowDeposit[]
  expenseLogs: ExpensePayoutLog[]
  vendors: Vendor[]
  disbursements: Disbursement[]
  messages: MessageThread[]
  scenario: typeof PROJECT_SCENARIO
  addTicket: (t: Omit<SupportTicket, 'id' | 'createdAt'>) => void
  updateTicket: (id: string, patch: Partial<SupportTicket>) => void
  addTask: (t: Omit<AgencyTask, 'id'>) => void
  completeTask: (id: string) => void
  addAppointment: (a: Omit<Appointment, 'id'>) => void
  addCalendarEvent: (e: Omit<CalendarEvent, 'id'>) => void
  createInvoice: (inv: Omit<ClientInvoice, 'id' | 'interestApplied'>) => void
  applyOverdueInterest: (invoiceId: string, pct: number) => void
  batchReceipts: (invoiceIds: string[]) => void
  addRetainer: (r: Omit<RetainerPlan, 'id'>) => void
  postRetainers: () => number
  recordEscrow: (e: Omit<EscrowDeposit, 'id'>) => void
  logExpenseSplit: (input: {
    project: string
    clientName: string
    talentName: string
    gross: number
    commissionPct: number
  }) => void
  issuePayout: (logId: string) => void
  sendMessage: (m: Omit<MessageThread, 'id' | 'sentAt' | 'status'>) => void
  advanceProspect: (id: string) => void
  createRenewalOffer: (talentId: string) => string
}

const AgencyDataContext = createContext<AgencyDataValue | null>(null)

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 999)}`
}

export function AgencyDataProvider({ children }: { children: ReactNode }) {
  const [clients] = useState(AGENCY_CLIENTS_SEED)
  const [talent, setTalent] = useState(AGENCY_TALENT_SEED)
  const [prospects, setProspects] = useState(AGENCY_PROSPECTS_SEED)
  const [tickets, setTickets] = useState(SUPPORT_TICKETS_SEED)
  const [tasks, setTasks] = useState(AGENCY_TASKS_SEED)
  const [appointments, setAppointments] = useState(APPOINTMENTS_SEED)
  const [calendar, setCalendar] = useState(CALENDAR_EVENTS_SEED)
  const [invoices, setInvoices] = useState(INVOICES_SEED)
  const [retainers, setRetainers] = useState(RETAINER_PLANS_SEED)
  const [escrow, setEscrow] = useState(ESCROW_SEED)
  const [expenseLogs, setExpenseLogs] = useState(EXPENSE_LOGS_SEED)
  const [vendors] = useState(VENDORS_SEED)
  const [disbursements, setDisbursements] = useState(DISBURSEMENTS_SEED)
  const [messages, setMessages] = useState(MESSAGES_SEED)

  const addTicket = useCallback((t: Omit<SupportTicket, 'id' | 'createdAt'>) => {
    setTickets((prev) => [
      {
        ...t,
        id: uid('tkt'),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
  }, [])

  const updateTicket = useCallback((id: string, patch: Partial<SupportTicket>) => {
    setTickets((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }, [])

  const addTask = useCallback((t: Omit<AgencyTask, 'id'>) => {
    setTasks((prev) => [{ ...t, id: uid('task') }, ...prev])
  }, [])

  const completeTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'done' as const } : t)))
  }, [])

  const addAppointment = useCallback((a: Omit<Appointment, 'id'>) => {
    setAppointments((prev) => [{ ...a, id: uid('appt') }, ...prev])
  }, [])

  const addCalendarEvent = useCallback((e: Omit<CalendarEvent, 'id'>) => {
    setCalendar((prev) => [{ ...e, id: uid('cal') }, ...prev])
    if (e.talentName && e.type === 'booking') {
      setTalent((prev) =>
        prev.map((t) =>
          t.name === e.talentName
            ? {
                ...t,
                available: false,
                bookedDates: t.bookedDates.includes(e.date)
                  ? t.bookedDates
                  : [...t.bookedDates, e.date],
              }
            : t,
        ),
      )
    }
  }, [])

  const createInvoice = useCallback((inv: Omit<ClientInvoice, 'id' | 'interestApplied'>) => {
    setInvoices((prev) => [
      { ...inv, id: uid('inv'), interestApplied: 0 },
      ...prev,
    ])
  }, [])

  const applyOverdueInterest = useCallback((invoiceId: string, pct: number) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv
        const fee = Math.round(inv.amount * (pct / 100))
        return {
          ...inv,
          status: 'overdue' as const,
          interestApplied: inv.interestApplied + fee,
          amount: inv.amount + fee,
        }
      }),
    )
  }, [])

  const batchReceipts = useCallback((invoiceIds: string[]) => {
    const paidAt = new Date().toISOString().slice(0, 10)
    setInvoices((prev) =>
      prev.map((inv) =>
        invoiceIds.includes(inv.id)
          ? { ...inv, status: 'paid' as const, paidAt }
          : inv,
      ),
    )
  }, [])

  const addRetainer = useCallback((r: Omit<RetainerPlan, 'id'>) => {
    setRetainers((prev) => [{ ...r, id: uid('ret') }, ...prev])
  }, [])

  const postRetainers = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    let count = 0
    setRetainers((rets) => {
      const active = rets.filter((r) => r.active)
      count = active.length
      setInvoices((prev) => [
        ...active.map((r) => ({
          id: uid('inv'),
          clientId: r.clientId,
          clientName: r.clientName,
          talentName: 'Retainer roster',
          project: r.description,
          amount: r.monthlyAmount,
          commissionPct: 0,
          status: 'sent' as const,
          issuedAt: today,
          dueAt: today,
          interestApplied: 0,
        })),
        ...prev,
      ])
      return rets
    })
    return count
  }, [])

  const recordEscrow = useCallback((e: Omit<EscrowDeposit, 'id'>) => {
    setEscrow((prev) => [{ ...e, id: uid('esc') }, ...prev])
  }, [])

  const logExpenseSplit = useCallback(
    (input: {
      project: string
      clientName: string
      talentName: string
      gross: number
      commissionPct: number
    }) => {
      const agencyCommission = Math.round(input.gross * (input.commissionPct / 100))
      const talentShare = input.gross - agencyCommission
      setExpenseLogs((prev) => [
        {
          id: uid('exp'),
          project: input.project,
          clientName: input.clientName,
          talentName: input.talentName,
          gross: input.gross,
          agencyCommission,
          talentShare,
          status: 'pending',
          loggedAt: new Date().toISOString(),
        },
        ...prev,
      ])
    },
    [],
  )

  const issuePayout = useCallback((logId: string) => {
    setExpenseLogs((prev) => {
      const log = prev.find((l) => l.id === logId)
      if (!log) return prev
      setDisbursements((d) => [
        {
          id: uid('dis'),
          payee: log.talentName,
          amount: log.talentShare,
          method: 'Direct deposit',
          status: 'completed',
          paidAt: new Date().toISOString(),
          project: log.project,
        },
        ...d,
      ])
      return prev.map((l) =>
        l.id === logId ? { ...l, status: 'completed' as const } : l,
      )
    })
  }, [])

  const sendMessage = useCallback((m: Omit<MessageThread, 'id' | 'sentAt' | 'status'>) => {
    setMessages((prev) => [
      {
        ...m,
        id: uid('msg'),
        sentAt: new Date().toISOString(),
        status: 'sent',
      },
      ...prev,
    ])
  }, [])

  const advanceProspect = useCallback((id: string) => {
    const order = ['new', 'screening', 'interview', 'offer', 'signed'] as const
    setProspects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const idx = order.indexOf(p.stage as (typeof order)[number])
        if (idx < 0 || idx >= order.length - 1) return p
        return { ...p, stage: order[idx + 1] }
      }),
    )
  }, [])

  const createRenewalOffer = useCallback((talentId: string) => {
    const t = talent.find((x) => x.id === talentId)
    return t
      ? `Renewal offer drafted for ${t.name} — 12-month exclusive representation.`
      : 'Talent not found.'
  }, [talent])

  const value = useMemo(
    () => ({
      clients,
      talent,
      prospects,
      tickets,
      tasks,
      appointments,
      calendar,
      invoices,
      retainers,
      escrow,
      expenseLogs,
      vendors,
      disbursements,
      messages,
      scenario: PROJECT_SCENARIO,
      addTicket,
      updateTicket,
      addTask,
      completeTask,
      addAppointment,
      addCalendarEvent,
      createInvoice,
      applyOverdueInterest,
      batchReceipts,
      addRetainer,
      postRetainers,
      recordEscrow,
      logExpenseSplit,
      issuePayout,
      sendMessage,
      advanceProspect,
      createRenewalOffer,
    }),
    [
      clients,
      talent,
      prospects,
      tickets,
      tasks,
      appointments,
      calendar,
      invoices,
      retainers,
      escrow,
      expenseLogs,
      vendors,
      disbursements,
      messages,
      addTicket,
      updateTicket,
      addTask,
      completeTask,
      addAppointment,
      addCalendarEvent,
      createInvoice,
      applyOverdueInterest,
      batchReceipts,
      addRetainer,
      postRetainers,
      recordEscrow,
      logExpenseSplit,
      issuePayout,
      sendMessage,
      advanceProspect,
      createRenewalOffer,
    ],
  )

  return (
    <AgencyDataContext.Provider value={value}>{children}</AgencyDataContext.Provider>
  )
}

export function useAgencyData() {
  const ctx = useContext(AgencyDataContext)
  if (!ctx) throw new Error('useAgencyData must be used within AgencyDataProvider')
  return ctx
}
