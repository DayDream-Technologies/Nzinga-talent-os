import {
  AGENCY_PROSPECTS_SEED,
  AGENCY_TALENT_SEED,
} from '@/constants/agency-seed'
import { nextAccountNumber } from '@/lib/account-number'
import type { AgencyProspect, AgencyTalent, WorkArea } from '@/types/agency'

const STORAGE_KEY = 'nto_agency_records_v1'

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

function hydrateProspects(list: AgencyProspect[], used: string[]): AgencyProspect[] {
  const ids = [...used]
  const seedById = Object.fromEntries(AGENCY_PROSPECTS_SEED.map((s) => [s.id, s]))
  return list.map((p) => {
    const accountId = p.accountId?.trim() || nextAccountNumber(ids)
    if (!p.accountId?.trim()) ids.push(accountId)
    const seed = seedById[p.id]
    return {
      ...p,
      accountId,
      workArea: p.workArea || DEFAULT_WORK_AREA,
      organization: p.organization || 'NZG',
      messageEmails:
        Array.isArray(p.messageEmails) && p.messageEmails.length > 0
          ? p.messageEmails
          : [p.email].filter(Boolean),
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
    return {
      ...t,
      accountId,
      workArea: t.workArea || DEFAULT_WORK_AREA,
    }
  })
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
