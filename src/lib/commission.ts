/** Agency default split: 20% retained, 80% talent share. */
export const DEFAULT_AGENCY_COMMISSION_PCT = 20

export function splitGross(gross: number, commissionPct = DEFAULT_AGENCY_COMMISSION_PCT): {
  gross: number
  commissionPct: number
  agencyCommission: number
  talentShare: number
} {
  const pct = Number.isFinite(commissionPct) ? commissionPct : DEFAULT_AGENCY_COMMISSION_PCT
  const agencyCommission = Math.round(gross * (pct / 100) * 100) / 100
  const talentShare = Math.round((gross - agencyCommission) * 100) / 100
  return { gross, commissionPct: pct, agencyCommission, talentShare }
}
