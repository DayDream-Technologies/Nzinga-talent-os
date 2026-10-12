import { nextAccountNumber } from '@/lib/account-number'
import { normalizeProspectStage } from '@/constants/prospect-stages'
import { AGENCY_PROPERTY } from '@/lib/session-storage'
import type { AgencyProspect, AgencyTalent, ClientLifecycleStatus, WorkArea } from '@/types/agency'

const STORAGE_KEY = 'nto_agency_records_v3'
const LEGACY_KEYS = ['nto_agency_records_v1', 'nto_agency_records_v2']

const DEFAULT_WORK_AREA: WorkArea = 'Acting'

interface AgencyRecords {
  prospects: AgencyProspect[]
  talent: AgencyTalent[]
}

function usedAccountIds(prospects: AgencyProspect[], talent: AgencyTalent[]): string[] {
  return [
    ...prospects.map((p) => p.accountId),
    ...talent.map((t) => t.accountId),
  ]
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = (name || '').trim().split(/\s+/)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function normalizeClientStatus(status: string | undefined): ClientLifecycleStatus {
  if (status === 'future' || status === 'past' || status === 'current') return status
  if (status === 'offboarding') return 'past'
  if (status === 'prospect') return 'future'
  return 'current'
}

function hydrateProspects(list: AgencyProspect[], used: string[]): AgencyProspect[] {
  const ids = [...used]
  return list.map((p) => {
    const accountId = p.accountId?.trim() || nextAccountNumber(ids)
    if (!p.accountId?.trim()) ids.push(accountId)
    const names = splitName(p.name)
    return {
      ...p,
      accountId,
      firstName: p.firstName || names.firstName,
      lastName: p.lastName || names.lastName,
      workArea: p.workArea || DEFAULT_WORK_AREA,
      organization: p.organization || 'NZG',
      property: p.property || AGENCY_PROPERTY,
      stage: normalizeProspectStage(p.stage),
      street: p.street ?? '',
      city: p.city ?? '',
      state: p.state ?? '',
      postal: p.postal ?? '',
      messageEmails:
        Array.isArray(p.messageEmails) && p.messageEmails.length > 0
          ? p.messageEmails
          : [p.email].filter(Boolean),
      contracts: Array.isArray(p.contracts) ? p.contracts : [],
      contractStart: p.contractStart ?? null,
      contractEnd: p.contractEnd ?? null,
    }
  })
}

function hydrateTalent(list: AgencyTalent[], used: string[]): AgencyTalent[] {
  const ids = [...used]
  return list.map((t) => {
    const accountId = t.accountId?.trim() || nextAccountNumber(ids)
    if (!t.accountId?.trim()) ids.push(accountId)
    const names = splitName(t.name)
    return {
      ...t,
      accountId,
      firstName: t.firstName || names.firstName,
      lastName: t.lastName || names.lastName,
      workArea: t.workArea || DEFAULT_WORK_AREA,
      division: t.division || t.workArea || DEFAULT_WORK_AREA,
      property: t.property || AGENCY_PROPERTY,
      status: normalizeClientStatus(t.status),
      contractStart: t.contractStart ?? null,
      contractEnd: t.contractEnd ?? null,
    }
  })
}

function dropLegacyDemoRecords(): void {
  try {
    for (const key of LEGACY_KEYS) localStorage.removeItem(key)
  } catch {
    // ignore storage errors
  }
}

export function loadAgencyRecords(): AgencyRecords {
  dropLegacyDemoRecords()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AgencyRecords>
      const prospectsIn = Array.isArray(parsed.prospects) ? parsed.prospects : []
      const talentIn = Array.isArray(parsed.talent) ? parsed.talent : []
      const prospects = hydrateProspects(prospectsIn, usedAccountIds(prospectsIn, talentIn))
      const talent = hydrateTalent(talentIn, usedAccountIds(prospects, talentIn))
      return { prospects, talent }
    }
  } catch {
    // start empty
  }
  return { prospects: [], talent: [] }
}

export function saveAgencyRecords(records: AgencyRecords): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // ignore quota / private mode
  }
}
