import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  AGENCY_CLIENTS_SEED,
  AGENCY_TASKS_SEED,
  APPOINTMENTS_SEED,
  CALENDAR_EVENTS_SEED,
  CHECKLIST_SEED,
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
import { loadAgencyRecords, saveAgencyRecords } from '@/services/agency-store'
import { nextAccountNumber } from '@/lib/account-number'
import type {
  AgencyClient,
  AgencyProspect,
  AgencyTalent,
  AgencyTask,
  Appointment,
  CalendarEvent,
  ChecklistItem,
  ClientInvoice,
  Disbursement,
  EscrowDeposit,
  ExpensePayoutLog,
  MessageThread,
  RetainerPlan,
  SupportTicket,
  Vendor,
  ProspectContract,
} from '@/types/agency'

interface AgencyDataValue {
  clients: AgencyClient[]
  talent: AgencyTalent[]
  prospects: AgencyProspect[]
  tickets: SupportTicket[]
  tasks: AgencyTask[]
  checklist: ChecklistItem[]
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
  completeTask: (id: string, completedBy: string) => void
  addChecklistItem: (title: string) => void
  toggleChecklistItem: (id: string) => void
  addAppointment: (a: Omit<Appointment, 'id'>) => void
  updateAppointment: (id: string, patch: Partial<Appointment>) => void
  deleteAppointment: (id: string) => void
  addCalendarEvent: (e: Omit<CalendarEvent, 'id'>) => void
  createInvoice: (inv: Omit<ClientInvoice, 'id' | 'interestApplied'> & { interestApplied?: number }) => void
  updateInvoice: (id: string, patch: Partial<ClientInvoice>) => void
  deleteInvoice: (id: string) => void
  applyOverdueInterest: (invoiceId: string, pct: number) => void
  batchReceipts: (invoiceIds: string[]) => void
  addRetainer: (r: Omit<RetainerPlan, 'id'>) => void
  updateRetainer: (id: string, patch: Partial<RetainerPlan>) => void
  deleteRetainer: (id: string) => void
  postRetainers: () => number
  recordEscrow: (e: Omit<EscrowDeposit, 'id'>) => void
  updateEscrow: (id: string, patch: Partial<EscrowDeposit>) => void
  deleteEscrow: (id: string) => void
  logExpenseSplit: (input: {
    project: string
    clientName: string
    talentName: string
    gross: number
    commissionPct: number
  }) => void
  addExpenseLog: (e: Omit<ExpensePayoutLog, 'id'>) => void
  updateExpenseLog: (id: string, patch: Partial<ExpensePayoutLog>) => void
  deleteExpenseLog: (id: string) => void
  issuePayout: (logId: string) => void
  addVendor: (v: Omit<Vendor, 'id'>) => void
  updateVendor: (id: string, patch: Partial<Vendor>) => void
  deleteVendor: (id: string) => void
  addDisbursement: (d: Omit<Disbursement, 'id'>) => void
  updateDisbursement: (id: string, patch: Partial<Disbursement>) => void
  deleteDisbursement: (id: string) => void
  sendMessage: (m: Omit<MessageThread, 'id' | 'sentAt' | 'status'>) => void
  createProspect: (
    input: Omit<
      AgencyProspect,
      'id' | 'accountId' | 'submittedAt' | 'stage' | 'contractStart' | 'contractEnd' | 'contracts'
    > & { contracts?: AgencyProspect['contracts'] },
  ) => AgencyProspect
  addProspectContract: (prospectId: string, contract: Omit<ProspectContract, 'id' | 'uploadedAt'> & { id?: string; uploadedAt?: string }) => void
  advanceProspect: (id: string) => void
  createRenewalOffer: (talentId: string) => string
}

const AgencyDataContext = createContext<AgencyDataValue | null>(null)

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 999)}`
}

function patchById<T extends { id: string }>(prev: T[], id: string, patch: Partial<T>): T[] {
  return prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
}

export function AgencyDataProvider({ children }: { children: ReactNode }) {
  const [clients] = useState(AGENCY_CLIENTS_SEED)
  const [stored] = useState(loadAgencyRecords)
  const [talent, setTalent] = useState(stored.talent)
  const [prospects, setProspects] = useState(stored.prospects)
  const [tickets, setTickets] = useState(SUPPORT_TICKETS_SEED)
  const [tasks, setTasks] = useState(AGENCY_TASKS_SEED)
  const [checklist, setChecklist] = useState(CHECKLIST_SEED)
  const [appointments, setAppointments] = useState(APPOINTMENTS_SEED)
  const [calendar, setCalendar] = useState(CALENDAR_EVENTS_SEED)
  const [invoices, setInvoices] = useState(INVOICES_SEED)
  const [retainers, setRetainers] = useState(RETAINER_PLANS_SEED)
  const [escrow, setEscrow] = useState(ESCROW_SEED)
  const [expenseLogs, setExpenseLogs] = useState(EXPENSE_LOGS_SEED)
  const [vendors, setVendors] = useState(VENDORS_SEED)
  const [disbursements, setDisbursements] = useState(DISBURSEMENTS_SEED)
  const [messages, setMessages] = useState(MESSAGES_SEED)

  useEffect(() => {
    saveAgencyRecords({ prospects, talent })
  }, [prospects, talent])

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
    setTickets((prev) => patchById(prev, id, patch))
  }, [])

  const addTask = useCallback((t: Omit<AgencyTask, 'id'>) => {
    setTasks((prev) => [{ ...t, id: uid('task') }, ...prev])
  }, [])

  const completeTask = useCallback((id: string, completedBy: string) => {
    const completedAt = new Date().toISOString()
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: 'done' as const, completedBy, completedAt }
          : t,
      ),
    )
  }, [])

  const addChecklistItem = useCallback((title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    setChecklist((prev) => [{ id: uid('chk'), title: trimmed, done: false }, ...prev])
  }, [])

  const toggleChecklistItem = useCallback((id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    )
  }, [])

  const addAppointment = useCallback((a: Omit<Appointment, 'id'>) => {
    setAppointments((prev) => [{ ...a, id: uid('appt') }, ...prev])
  }, [])

  const updateAppointment = useCallback((id: string, patch: Partial<Appointment>) => {
    setAppointments((prev) => patchById(prev, id, patch))
  }, [])

  const deleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((x) => x.id !== id))
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

  const createInvoice = useCallback(
    (inv: Omit<ClientInvoice, 'id' | 'interestApplied'> & { interestApplied?: number }) => {
      const amount = inv.amount || 0
      const taxRatePct = inv.taxRatePct ?? 0
      const taxAmount = inv.taxAmount ?? Math.round(amount * (taxRatePct / 100))
      setInvoices((prev) => [
        {
          ...inv,
          id: uid('inv'),
          interestApplied: inv.interestApplied ?? 0,
          taxId: inv.taxId ?? '',
          taxRatePct,
          taxAmount,
          document: inv.document ?? null,
        },
        ...prev,
      ])
    },
    [],
  )

  const updateInvoice = useCallback((id: string, patch: Partial<ClientInvoice>) => {
    setInvoices((prev) => patchById(prev, id, patch))
  }, [])

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const applyOverdueInterest = useCallback((invoiceId: string, pct: number) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv
        const fee = Math.round(inv.amount * (pct / 100))
        const amount = inv.amount + fee
        const taxRatePct = inv.taxRatePct ?? 0
        const taxAmount = Math.round(amount * (taxRatePct / 100))
        return {
          ...inv,
          status: 'overdue' as const,
          interestApplied: inv.interestApplied + fee,
          amount,
          taxAmount,
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

  const updateRetainer = useCallback((id: string, patch: Partial<RetainerPlan>) => {
    setRetainers((prev) => patchById(prev, id, patch))
  }, [])

  const deleteRetainer = useCallback((id: string) => {
    setRetainers((prev) => prev.filter((x) => x.id !== id))
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
          taxId: '',
          taxRatePct: 0,
          taxAmount: 0,
          invoiceNumber: `INV-RET-${today.replace(/-/g, '')}`,
          poNumber: '',
          paymentTerms: 'Net 30',
          billingAddress: '',
          notes: 'Auto-posted retainer',
          document: null,
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

  const updateEscrow = useCallback((id: string, patch: Partial<EscrowDeposit>) => {
    setEscrow((prev) => patchById(prev, id, patch))
  }, [])

  const deleteEscrow = useCallback((id: string) => {
    setEscrow((prev) => prev.filter((x) => x.id !== id))
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

  const addExpenseLog = useCallback((e: Omit<ExpensePayoutLog, 'id'>) => {
    setExpenseLogs((prev) => [{ ...e, id: uid('exp') }, ...prev])
  }, [])

  const updateExpenseLog = useCallback((id: string, patch: Partial<ExpensePayoutLog>) => {
    setExpenseLogs((prev) => patchById(prev, id, patch))
  }, [])

  const deleteExpenseLog = useCallback((id: string) => {
    setExpenseLogs((prev) => prev.filter((x) => x.id !== id))
  }, [])

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

  const addVendor = useCallback((v: Omit<Vendor, 'id'>) => {
    setVendors((prev) => [{ ...v, id: uid('ven') }, ...prev])
  }, [])

  const updateVendor = useCallback((id: string, patch: Partial<Vendor>) => {
    setVendors((prev) => patchById(prev, id, patch))
  }, [])

  const deleteVendor = useCallback((id: string) => {
    setVendors((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const addDisbursement = useCallback((d: Omit<Disbursement, 'id'>) => {
    setDisbursements((prev) => [{ ...d, id: uid('dis') }, ...prev])
  }, [])

  const updateDisbursement = useCallback((id: string, patch: Partial<Disbursement>) => {
    setDisbursements((prev) => patchById(prev, id, patch))
  }, [])

  const deleteDisbursement = useCallback((id: string) => {
    setDisbursements((prev) => prev.filter((x) => x.id !== id))
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

  const createProspect = useCallback(
    (
      input: Omit<
        AgencyProspect,
        'id' | 'accountId' | 'submittedAt' | 'stage' | 'contractStart' | 'contractEnd' | 'contracts'
      > & { contracts?: AgencyProspect['contracts'] },
    ) => {
      const used = [
        ...prospects.map((p) => p.accountId),
        ...talent.map((t) => t.accountId),
      ]
      const created: AgencyProspect = {
        ...input,
        id: uid('pros'),
        accountId: nextAccountNumber(used),
        submittedAt: new Date().toISOString(),
        stage: 'new',
        contractStart: null,
        contractEnd: null,
        contracts: input.contracts ?? [],
        messageEmails:
          input.messageEmails?.length > 0
            ? input.messageEmails
            : [input.email].filter(Boolean),
      }
      setProspects((prev) => [created, ...prev])
      return created
    },
    [prospects, talent],
  )

  const addProspectContract = useCallback(
    (
      prospectId: string,
      contract: Omit<ProspectContract, 'id' | 'uploadedAt'> & { id?: string; uploadedAt?: string },
    ) => {
      const full: ProspectContract = {
        ...contract,
        id: contract.id || uid('ctr'),
        uploadedAt: contract.uploadedAt || new Date().toISOString(),
      }
      setProspects((prev) =>
        prev.map((p) => {
          if (p.id !== prospectId) return p
          const contracts =
            full.status === 'current'
              ? [
                  ...p.contracts.map((c) =>
                    c.status === 'current' ? { ...c, status: 'past' as const } : c,
                  ),
                  full,
                ]
              : [...p.contracts, full]
          return {
            ...p,
            contracts,
            contractStart: full.status === 'current' ? full.startDate : p.contractStart,
            contractEnd: full.status === 'current' ? full.endDate ?? null : p.contractEnd,
            representationType: full.representationType ?? p.representationType,
            termLengthYears: full.termLengthYears ?? p.termLengthYears,
          }
        }),
      )
    },
    [],
  )

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
      checklist,
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
      addChecklistItem,
      toggleChecklistItem,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      addCalendarEvent,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      applyOverdueInterest,
      batchReceipts,
      addRetainer,
      updateRetainer,
      deleteRetainer,
      postRetainers,
      recordEscrow,
      updateEscrow,
      deleteEscrow,
      logExpenseSplit,
      addExpenseLog,
      updateExpenseLog,
      deleteExpenseLog,
      issuePayout,
      addVendor,
      updateVendor,
      deleteVendor,
      addDisbursement,
      updateDisbursement,
      deleteDisbursement,
      sendMessage,
      createProspect,
      addProspectContract,
      advanceProspect,
      createRenewalOffer,
    }),
    [
      clients,
      talent,
      prospects,
      tickets,
      tasks,
      checklist,
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
      addChecklistItem,
      toggleChecklistItem,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      addCalendarEvent,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      applyOverdueInterest,
      batchReceipts,
      addRetainer,
      updateRetainer,
      deleteRetainer,
      postRetainers,
      recordEscrow,
      updateEscrow,
      deleteEscrow,
      logExpenseSplit,
      addExpenseLog,
      updateExpenseLog,
      deleteExpenseLog,
      issuePayout,
      addVendor,
      updateVendor,
      deleteVendor,
      addDisbursement,
      updateDisbursement,
      deleteDisbursement,
      sendMessage,
      createProspect,
      addProspectContract,
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
