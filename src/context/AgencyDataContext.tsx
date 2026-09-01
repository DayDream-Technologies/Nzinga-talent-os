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
  ClientLifecycleStatus,
  Disbursement,
  EscrowDeposit,
  ExpensePayoutLog,
  MessageThread,
  RetainerPlan,
  SupportTicket,
  Vendor,
  ProspectContract,
  ProspectStage,
} from '@/types/agency'
import { nextProspectStage, normalizeProspectStage, PROSPECT_TRACKING_STAGES } from '@/constants/prospect-stages'
import { shouldAdvanceSopStatus } from '@/constants/sop-status'
import { AGENCY_PROPERTY } from '@/lib/session-storage'
import { clientFromSignedProspect, signPendingContract } from '@/lib/sop-workflow'

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
  updateCalendarEvent: (id: string, patch: Partial<CalendarEvent>) => void
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
  issuePayout: (logId: string, details?: { notes?: string; method?: string; approvedBy?: string }) => void
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
    > & { contracts?: AgencyProspect['contracts']; stage?: ProspectStage },
  ) => AgencyProspect
  updateProspect: (id: string, patch: Partial<AgencyProspect>) => void
  setProspectStage: (id: string, stage: ProspectStage) => void
  deleteProspects: (ids: string[]) => void
  mergeProspects: (survivorId: string, duplicateId: string) => void
  upsertProspectFromApplication: (input: {
    email: string
    name: string
    stage: ProspectStage
    applicationId?: string
    organization?: string
    sopSubStatus?: string | null
  }) => void
  createClient: (input: {
    firstName: string
    lastName: string
    email: string
    phone: string
    division: string
    status: ClientLifecycleStatus
    contractStart: string
    contractEnd: string
    linkedProspectId?: string | null
    accountId?: string
  }) => AgencyTalent
  updateTalent: (id: string, patch: Partial<AgencyTalent>) => void
  archiveClients: (ids: string[]) => void
  restoreClients: (ids: string[]) => void
  addProspectContract: (prospectId: string, contract: Omit<ProspectContract, 'id' | 'uploadedAt'> & { id?: string; uploadedAt?: string }) => void
  upsertProspectSop: (input: {
    email?: string
    name?: string
    applicationId?: string | null
    talentEmail?: string
    talentName?: string
    stage: ProspectStage
    sopSubStatus: string
    organization?: string
  }) => AgencyProspect | null
  signProspectContract: (prospectId: string, contractId: string, signedName: string) => AgencyTalent | null
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

  const updateCalendarEvent = useCallback((id: string, patch: Partial<CalendarEvent>) => {
    setCalendar((prev) => patchById(prev, id, patch))
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

  const issuePayout = useCallback((logId: string, details?: { notes?: string; method?: string; approvedBy?: string }) => {
    setExpenseLogs((prev) => {
      const log = prev.find((l) => l.id === logId)
      if (!log) return prev
      const method = details?.method?.trim() || 'Direct deposit'
      setDisbursements((d) => [
        {
          id: uid('dis'),
          payee: log.talentName,
          amount: log.talentShare,
          method,
          status: 'completed',
          paidAt: new Date().toISOString(),
          project: log.project,
        },
        ...d,
      ])
      return prev.map((l) =>
        l.id === logId
          ? {
              ...l,
              status: 'completed' as const,
              notes: details?.notes?.trim() || l.notes,
              approvedBy: details?.approvedBy || l.approvedBy,
              approvedAt: new Date().toISOString(),
              payoutMethod: method,
            }
          : l,
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
      > & { contracts?: AgencyProspect['contracts']; stage?: ProspectStage },
    ) => {
      const used = [
        ...prospects.map((p) => p.accountId),
        ...talent.map((t) => t.accountId),
      ]
      const nameParts = (input.name || '').trim().split(/\s+/)
      const created: AgencyProspect = {
        ...input,
        id: uid('pros'),
        accountId: nextAccountNumber(used),
        submittedAt: new Date().toISOString(),
        stage: normalizeProspectStage(input.stage || 'new_prospect'),
        property: input.property || AGENCY_PROPERTY,
        firstName: input.firstName || nameParts[0] || '',
        lastName: input.lastName || nameParts.slice(1).join(' ') || '',
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

  const updateProspect = useCallback((id: string, patch: Partial<AgencyProspect>) => {
    setProspects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const next = { ...p, ...patch }
        if (patch.stage) next.stage = normalizeProspectStage(patch.stage)
        if (patch.name && !patch.firstName) {
          const parts = patch.name.trim().split(/\s+/)
          next.firstName = parts[0] || p.firstName
          next.lastName = parts.slice(1).join(' ') || p.lastName
        }
        return next
      }),
    )
  }, [])

  const setProspectStage = useCallback((id: string, stage: ProspectStage) => {
    updateProspect(id, { stage: normalizeProspectStage(stage) })
  }, [updateProspect])

  const deleteProspects = useCallback((ids: string[]) => {
    const set = new Set(ids)
    setProspects((prev) => prev.filter((p) => !set.has(p.id)))
  }, [])

  const mergeProspects = useCallback((survivorId: string, duplicateId: string) => {
    setProspects((prev) => {
      const survivor = prev.find((p) => p.id === survivorId)
      const dup = prev.find((p) => p.id === duplicateId)
      if (!survivor || !dup) return prev
      const merged: AgencyProspect = {
        ...survivor,
        notes: [survivor.notes, dup.notes].filter(Boolean).join('\n\n'),
        contracts: [...(survivor.contracts || []), ...(dup.contracts || [])],
        messageEmails: [...new Set([...(survivor.messageEmails || []), ...(dup.messageEmails || [])])],
        linkedApplicationId: survivor.linkedApplicationId || dup.linkedApplicationId,
        phone: survivor.phone || dup.phone,
        street: survivor.street || dup.street,
        city: survivor.city || dup.city,
        state: survivor.state || dup.state,
        postal: survivor.postal || dup.postal,
        parentName: survivor.parentName || dup.parentName,
        parentEmail: survivor.parentEmail || dup.parentEmail,
        parentPhone: survivor.parentPhone || dup.parentPhone,
      }
      return prev.filter((p) => p.id !== duplicateId).map((p) => (p.id === survivorId ? merged : p))
    })
  }, [])

  const upsertProspectFromApplication = useCallback(
    (input: {
      email: string
      name: string
      stage: ProspectStage
      applicationId?: string
      organization?: string
      sopSubStatus?: string | null
    }) => {
      const email = input.email.trim().toLowerCase()
      if (!email) return
      setProspects((prev) => {
        const existing = prev.find(
          (p) =>
            p.email.toLowerCase() === email ||
            (input.applicationId && p.linkedApplicationId === input.applicationId),
        )
        if (existing) {
          const currentRank = PROSPECT_TRACKING_STAGES.indexOf(normalizeProspectStage(existing.stage))
          const nextRank = PROSPECT_TRACKING_STAGES.indexOf(normalizeProspectStage(input.stage))
          const stage =
            nextRank >= 0 && currentRank >= 0 && nextRank < currentRank
              ? existing.stage
              : normalizeProspectStage(input.stage)
          const sopSubStatus =
            input.sopSubStatus && shouldAdvanceSopStatus(existing.sopSubStatus, input.sopSubStatus)
              ? input.sopSubStatus
              : existing.sopSubStatus
          return prev.map((p) =>
            p.id === existing.id
              ? {
                  ...p,
                  stage,
                  sopSubStatus,
                  linkedApplicationId: input.applicationId || p.linkedApplicationId,
                  name: p.name || input.name,
                }
              : p,
          )
        }
        const used = [...prev.map((p) => p.accountId), ...talent.map((t) => t.accountId)]
        const parts = input.name.trim().split(/\s+/)
        const created: AgencyProspect = {
          id: uid('pros'),
          accountId: nextAccountNumber(used),
          name: input.name,
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
          email: input.email,
          workArea: 'Acting',
          stage: normalizeProspectStage(input.stage),
          source: 'Portal application',
          submittedAt: new Date().toISOString(),
          notes: '',
          organization: (input.organization || 'NZG').toUpperCase(),
          property: AGENCY_PROPERTY,
          messageEmails: [input.email],
          contracts: [],
          contractStart: null,
          contractEnd: null,
          linkedApplicationId: input.applicationId || null,
          sopSubStatus: input.sopSubStatus || null,
        }
        return [created, ...prev]
      })
    },
    [talent],
  )

  const createClient = useCallback(
    (input: {
      firstName: string
      lastName: string
      email: string
      phone: string
      division: string
      status: ClientLifecycleStatus
      contractStart: string
      contractEnd: string
      linkedProspectId?: string | null
      accountId?: string
    }) => {
      const used = [
        ...prospects.map((p) => p.accountId),
        ...talent.map((t) => t.accountId),
      ]
      const name = `${input.firstName} ${input.lastName}`.trim()
      const created: AgencyTalent = {
        id: uid('talent'),
        accountId: input.accountId || nextAccountNumber(used),
        name,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        role: 'Signed Talent',
        status: input.status,
        workArea: (input.division as AgencyTalent['workArea']) || 'Modeling',
        division: input.division,
        niches: [],
        property: AGENCY_PROPERTY,
        bankReady: false,
        taxFormsReady: false,
        available: true,
        bookedDates: [],
        contractStart: input.contractStart || null,
        contractEnd: input.contractEnd || null,
        linkedProspectId: input.linkedProspectId || null,
      }
      setTalent((prev) => [created, ...prev])
      return created
    },
    [prospects, talent],
  )

  const updateTalentRecord = useCallback((id: string, patch: Partial<AgencyTalent>) => {
    setTalent((prev) => patchById(prev, id, patch))
  }, [])

  const archiveClients = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setTalent((prev) => prev.map((t) => (idSet.has(t.id) ? { ...t, status: 'past' as const } : t)))
  }, [])

  const restoreClients = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setTalent((prev) => prev.map((t) => (idSet.has(t.id) ? { ...t, status: 'current' as const } : t)))
  }, [])

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

  const upsertProspectSop = useCallback(
    (input: {
      email?: string
      name?: string
      applicationId?: string | null
      talentEmail?: string
      talentName?: string
      stage: ProspectStage
      sopSubStatus: string
      organization?: string
    }): AgencyProspect | null => {
      const email = (input.email || input.talentEmail || '').trim().toLowerCase()
      const name = input.name || input.talentName || email
      if (!email && !input.applicationId) return null
      let result: AgencyProspect | null = null
      setProspects((prev) => {
        const existing = prev.find(
          (p) =>
            (email && p.email.toLowerCase() === email) ||
            (input.applicationId && p.linkedApplicationId === input.applicationId),
        )
        if (existing) {
          const next = prev.map((p) =>
            p.id === existing.id
              ? {
                  ...p,
                  stage: input.stage,
                  sopSubStatus: input.sopSubStatus,
                  linkedApplicationId: input.applicationId || p.linkedApplicationId,
                  name: p.name || name,
                }
              : p,
          )
          result = next.find((p) => p.id === existing.id) || null
          return next
        }
        const used = [...prev.map((p) => p.accountId), ...talent.map((t) => t.accountId)]
        const parts = name.trim().split(/\s+/)
        const created: AgencyProspect = {
          id: uid('pros'),
          accountId: nextAccountNumber(used),
          name,
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
          email: input.email || input.talentEmail || '',
          workArea: 'Acting',
          stage: input.stage,
          source: 'Client packet',
          submittedAt: new Date().toISOString(),
          notes: '',
          organization: (input.organization || 'NZG').toUpperCase(),
          property: AGENCY_PROPERTY,
          messageEmails: email ? [email] : [],
          contracts: [],
          contractStart: null,
          contractEnd: null,
          linkedApplicationId: input.applicationId || null,
          sopSubStatus: input.sopSubStatus,
        }
        result = created
        return [created, ...prev]
      })
      return result
    },
    [talent],
  )

  const signProspectContract = useCallback(
    (prospectId: string, contractId: string, signedName: string): AgencyTalent | null => {
      let created: AgencyTalent | null = null
      setProspects((prev) => {
        const prospect = prev.find((p) => p.id === prospectId)
        if (!prospect) return prev
        const contracts = signPendingContract(prospect.contracts || [], contractId, signedName)
        const updated: AgencyProspect = {
          ...prospect,
          contracts,
          stage: 'contract_completed',
          sopSubStatus: 'Active',
          lost: false,
        }
        const draft = clientFromSignedProspect(updated)
        const used = [
          ...prev.map((p) => p.accountId),
          ...talent.map((t) => t.accountId),
        ]
        created = {
          ...draft,
          id: uid('talent'),
          accountId: draft.accountId || nextAccountNumber(used),
        }
        setTalent((roster) => {
          const existing = roster.find(
            (t) =>
              t.linkedProspectId === prospectId ||
              (created && t.accountId === created.accountId) ||
              (created?.email && (t.email || '').toLowerCase() === created.email.toLowerCase()),
          )
          if (existing) {
            created = { ...existing, ...draft, id: existing.id, status: 'current' }
            return roster.map((t) => (t.id === existing.id ? created! : t))
          }
          return [created!, ...roster]
        })
        return prev.map((p) => (p.id === prospectId ? updated : p))
      })
      return created
    },
    [talent],
  )

  const advanceProspect = useCallback((id: string) => {
    setProspects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const next = nextProspectStage(normalizeProspectStage(p.stage))
        return next ? { ...p, stage: next } : p
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
      updateCalendarEvent,
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
      updateProspect,
      setProspectStage,
      deleteProspects,
      mergeProspects,
      upsertProspectFromApplication,
      createClient,
      updateTalent: updateTalentRecord,
      archiveClients,
      restoreClients,
      addProspectContract,
      upsertProspectSop,
      signProspectContract,
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
      updateCalendarEvent,
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
      updateProspect,
      setProspectStage,
      deleteProspects,
      mergeProspects,
      upsertProspectFromApplication,
      createClient,
      updateTalentRecord,
      archiveClients,
      restoreClients,
      addProspectContract,
      upsertProspectSop,
      signProspectContract,
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
