import type { ScoutRecommendation, ScreeningStatus } from '@/types/talent'

export const SCREENING_STATUS_LABELS: Record<ScreeningStatus, string> = {
  not_started: 'Not Started',
  invitation_sent: 'Invitation Sent',
  awaiting_applicant: 'Awaiting Applicant',
  in_progress: 'Screening in Progress',
  complete: 'Screening Complete',
  review_required: 'Review Required',
  cleared: 'Cleared',
  disputed: 'Disputed',
  unable_to_complete: 'Unable to Complete',
}

export const SCOUT_RECOMMENDATION_LABELS: Record<ScoutRecommendation, string> = {
  recommend: 'Recommend for Further Consideration',
  more_information: 'Additional Information Required',
  do_not_recommend: 'Do Not Recommend',
  unable_to_complete: 'Unable to Complete Review',
}

/** Map any provider payload into TMX statuses. */
export function mapProviderScreeningStatus(raw: string): ScreeningStatus {
  const v = raw.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (v.includes('clear') || v === 'clear' || v === 'complete_clear') return 'cleared'
  if (v.includes('dispute')) return 'disputed'
  if (v.includes('review') || v.includes('consider')) return 'review_required'
  if (v.includes('unable') || v.includes('cancel') || v.includes('error')) return 'unable_to_complete'
  if (v.includes('progress') || v === 'pending') return 'in_progress'
  if (v.includes('await')) return 'awaiting_applicant'
  if (v.includes('invit') || v.includes('sent')) return 'invitation_sent'
  if (v.includes('complete')) return 'complete'
  return 'not_started'
}

export function screeningAllowsPacketSubmit(status?: ScreeningStatus | null): boolean {
  return status === 'cleared' || status === 'review_required' || status === 'complete'
}
