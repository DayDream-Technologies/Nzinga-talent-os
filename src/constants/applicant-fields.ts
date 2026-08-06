/**
 * 1:1 RMX → Nzinga applicant field dictionary options.
 * Source: Replacement Dictionary Converting (Nzinga Management Agency).
 */

export const ROSTER_DIVISIONS = [
  'High Fashion',
  'Commercial',
  'Voiceover',
  'TV/Film',
  'Print',
] as const

export const SECONDARY_SPECIALIZATIONS = [
  'Stunts',
  'Runway',
  'Influencer',
  'Curve',
  'Editorial',
] as const

export const CONTRACT_DURATION_PREFS = [
  '12 Months',
  '24 Months',
  'Non-Exclusive',
  'Open to Discussion',
] as const

export const APPLICANT_STAGE_STATUSES = [
  'New Inquiry',
  'Portfolio Review',
  'Screen Test',
  'Callback',
  'Audition',
  'Contract Sent',
  'Approved',
] as const

export const DISCOVERY_SOURCES = [
  'Instagram',
  'Open Call',
  'Agent Scout',
  'Referral',
  'Social Media',
  'Other',
] as const

export const PREFERRED_OUTREACH_CHANNELS = [
  'Email',
  'Phone',
  'SMS',
  'WhatsApp',
] as const

export const UNION_AFFILIATIONS = [
  'SAG-AFTRA',
  'Equity',
  'Non-Union',
] as const

export const REFERENCE_CHECK_STATUSES = [
  'Not Started',
  'In Progress',
  'Cleared',
  'Flagged',
] as const

export const YES_NO = ['Yes', 'No'] as const

export const MEDIA_UPLOAD_TYPES = [
  { id: 'headshot', label: 'Headshot / Digitals' },
  { id: 'reel', label: 'Video Reel' },
  { id: 'resume', label: 'Acting Resume / Portfolio' },
] as const
