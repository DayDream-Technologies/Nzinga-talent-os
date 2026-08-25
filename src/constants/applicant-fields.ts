/**
 * NZG short-application option lists (Application Build Requirements).
 */

export const REPRESENTATION_INTERESTS = [
  'Modeling',
  'Acting',
  'Sports & Athletics',
  'Influencing / Content Creation',
] as const

export const EXPERIENCE_LEVELS = [
  'New / Emerging',
  'Some Experience',
  'Experienced',
  'Professional',
  'Established',
] as const

export const MODELING_CATEGORIES = [
  'Editorial',
  'Runway',
  'Commercial',
  'Print',
  'E-Commerce',
  'Beauty',
  'Lifestyle',
  'Fitness',
  'Swimwear',
  'Promotional',
  'Other',
] as const

export const ACTING_CATEGORIES = [
  'Film',
  'Television',
  'Streaming',
  'Theater',
  'Commercial',
  'Voiceover',
  'Hosting',
  'Music Video',
  'Short Film',
  'Other',
] as const

export const INFLUENCER_CONTENT_CATEGORIES = [
  'Fashion',
  'Beauty',
  'Lifestyle',
  'Fitness',
  'Sports',
  'Gaming',
  'Entertainment',
  'Comedy',
  'Food',
  'Travel',
  'Music',
  'Education',
  'Technology',
  'Business',
  'Other',
] as const

export const SOCIAL_PLATFORMS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Facebook',
  'X',
  'Twitch',
  'Snapchat',
  'Other',
] as const

export const WORK_MARKETS = ['Local', 'Regional', 'National', 'International'] as const

export const YES_NO = ['Yes', 'No'] as const

export const REPRESENTATION_TYPES = ['Exclusive', 'Non-exclusive', 'Mixed / Other'] as const

/** Early scout sub-statuses within holding_entry (New / Lead). */
export const APPLICANT_STAGE_STATUSES = [
  'New / Lead',
  'Under Review',
  'Qualification in Progress',
  'Application Submitted / Under Vetting',
  'Qualified',
  'Client Packet Pending',
  'In Manager Review',
  'Approved - Future',
  'Contract Published / Pending Signature',
  'Active',
  'Withdrawn',
] as const

/** Legacy option lists retained for staff TalentRecord selects. */
export const WORK_AREAS = [
  'Acting',
  'Modeling',
  'Voiceover',
  'Influencer',
  'Commercial',
] as const

export const ROSTER_DIVISIONS = [
  'Modeling',
  'Acting',
  'Sports & Athletics',
  'Influencing / Content Creation',
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

export const MEDIA_UPLOAD_TYPES = [
  { id: 'headshot', label: 'Headshot / Digitals' },
  { id: 'reel', label: 'Video Reel' },
  { id: 'resume', label: 'Acting Resume / Portfolio' },
] as const
