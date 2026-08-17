import {
  AGENCY_PROSPECTS_SEED,
  AGENCY_TALENT_SEED,
} from '@/constants/agency-seed'
import { nextAccountNumber } from '@/lib/account-number'
import { normalizeProspectStage } from '@/constants/prospect-stages'
import { AGENCY_PROPERTY } from '@/lib/session-storage'
import type { AgencyProspect, AgencyTalent, ClientLifecycleStatus, WorkArea } from '@/types/agency'

const STORAGE_KEY = 'nto_agency_records_v2'

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
  const seedById = Object.fromEntries(AGENCY_PROSPECTS_SEED.map((s) => [s.id, s]))
  return list.map((p) => {
    const accountId = p.accountId?.trim() || nextAccountNumber(ids)
    if (!p.accountId?.trim()) ids.push(accountId)
    const seed = seedById[p.id]
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
      street: p.street ?? seed?.street ?? '',
      city: p.city ?? seed?.city ?? '',
      state: p.state ?? seed?.state ?? '',
      postal: p.postal ?? seed?.postal ?? '',
      messageEmails:
        Array.isArray(p.messageEmails) && p.messageEmails.length > 0
          ? p.messageEmails
          : [p.email].filter(Boolean),
      contracts: Array.isArray(p.contracts) ? p.contracts : seed?.contracts ?? [],
      contractStart: p.contractStart !== undefined ? p.contractStart : seed?.contractStart ?? null,
      contractEnd: p.contractEnd !== undefined ? p.contractEnd : seed?.contractEnd ?? null,
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

function tryLoadV1(): Partial<AgencyRecords> | null {
  try {
    const raw = localStorage.getItem('nto_agency_records_v1')
    if (!raw) return null
    return JSON.parse(raw) as Partial<AgencyRecords>
  } catch {
    return null
  }
}

export function loadAgencyRecords(): AgencyRecords {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AgencyRecords>
      const prospectsIn = Array.isArray(parsed.prospects) ? parsed.prospects : AGENCY_PROSPECTS_SEED
      const talentIn = Array.isArray(parsed.talent) ? parsed.talent : AGENCY_TALENT_SEED
      const prospects = hydrateProspects(prospectsIn, usedAccountIds(prospectsIn, talentIn))
      const talent = hydrateTalent(talentIn, usedAccountIds(prospects, talentIn))
      return { prospects, talent }
    }
    const v1 = tryLoadV1()
    if (v1) {
      const prospectsIn = Array.isArray(v1.prospects) ? v1.prospects : AGENCY_PROSPECTS_SEED
      const talentIn = Array.isArray(v1.talent) ? v1.talent : AGENCY_TALENT_SEED
      const prospects = hydrateProspects(prospectsIn, usedAccountIds(prospectsIn, talentIn))
      const talent = hydrateTalent(talentIn, usedAccountIds(prospects, talentIn))
      return { prospects, talent }
    }
  } catch {
    // fall through to seed
  }
  const prospects = hydrateProspects(AGENCY_PROSPECTS_SEED, [])
  const talent = hydrateTalent(AGENCY_TALENT_SEED, usedAccountIds(prospects, []))
  return { prospects, talent }
}

export function saveAgencyRecords(records: AgencyRecords): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // ignore quota / private mode
  }
}
