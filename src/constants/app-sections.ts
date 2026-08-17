import type {
  AppField,
  AppFieldCondition,
  AppSection,
  Application,
  ApplicationData,
  Talent,
  UploadedDoc,
} from '@/types'
import {
  ACTING_CATEGORIES,
  EXPERIENCE_LEVELS,
  INFLUENCER_CONTENT_CATEGORIES,
  MODELING_CATEGORIES,
  REPRESENTATION_INTERESTS,
  REPRESENTATION_TYPES,
  SOCIAL_PLATFORMS,
  WORK_MARKETS,
  YES_NO,
} from './applicant-fields'

const interest = (label: string): AppFieldCondition => ({
  field: 'representation_interests',
  includes: label,
})

const equalsYes = (field: string): AppFieldCondition => ({ field, equals: 'Yes' })

export const APP_SECTIONS: AppSection[] = [
  {
    id: 'personal',
    label: 'Basic Information',
    icon: '',
    fields: [
      { id: 'legal_first', label: 'Legal First Name', type: 'text', required: true },
      { id: 'legal_middle', label: 'Middle Name', type: 'text', required: false },
      { id: 'legal_last', label: 'Legal Last Name', type: 'text', required: true },
      { id: 'preferred_name', label: 'Preferred / Professional Name', type: 'text', required: true },
      { id: 'pronouns', label: 'Pronouns', type: 'text', required: false },
      { id: 'dob', label: 'Date of Birth', type: 'date', required: true, note: 'Age is calculated automatically' },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'phone', label: 'Phone', type: 'tel', required: true },
      { id: 'city', label: 'City', type: 'text', required: true },
      { id: 'state', label: 'State / Province', type: 'text', required: true },
      { id: 'country', label: 'Country', type: 'text', required: true },
      { id: 'current_market', label: 'Current Market / Location', type: 'text', required: true },
      { id: 'website', label: 'Website', type: 'url', required: false },
      {
        id: 'doc_profile_photo',
        label: 'Profile Photo',
        type: 'file_upload',
        required: true,
        note: 'Clear head-and-shoulders photo',
      },
      {
        id: 'guardian_invite_email',
        label: 'Parent / Legal Guardian Email',
        type: 'email',
        requiredIf: { field: 'dob', condition: 'minor' },
        note: 'We will email your parent/guardian a secure verification link. Do not fill out their information for them.',
      },
    ],
  },
  {
    id: 'interests',
    label: 'Representation Interest',
    icon: '',
    fields: [
      {
        id: 'representation_interests',
        label: 'What type(s) of representation are you interested in?',
        type: 'multicheck',
        options: [...REPRESENTATION_INTERESTS],
        required: true,
        note: 'Select all that apply — you will only see questions for your selections.',
      },
    ],
  },
  {
    id: 'general',
    label: 'About You',
    icon: '',
    fields: [
      {
        id: 'experience_level',
        label: 'Current experience level',
        type: 'select',
        options: [...EXPERIENCE_LEVELS],
        required: true,
      },
      {
        id: 'about_yourself',
        label: 'Tell us briefly about yourself',
        type: 'textarea',
        required: true,
        minLength: 200,
        maxLength: 500,
        note: '200–500 characters',
      },
      {
        id: 'career_goals',
        label: 'What are your primary career goals?',
        type: 'textarea',
        required: true,
        minLength: 200,
        maxLength: 500,
        note: '200–500 characters',
      },
      {
        id: 'proud_accomplishments',
        label: 'What experience or accomplishments are you most proud of?',
        type: 'textarea',
        required: true,
        minLength: 200,
        maxLength: 500,
        note: '200–500 characters',
      },
      {
        id: 'why_nzinga_interest',
        label: 'Why are you interested in representation with Nzinga?',
        type: 'textarea',
        required: true,
        minLength: 200,
        maxLength: 500,
        note: '200–500 characters',
      },
    ],
  },
  {
    id: 'modeling',
    label: 'Modeling',
    icon: '',
    showIf: interest('Modeling'),
    fields: [
      { id: 'model_height', label: 'Height', type: 'text', required: true },
      { id: 'model_clothing_size', label: 'Clothing Size', type: 'text', required: true },
      { id: 'model_shoe_size', label: 'Shoe Size', type: 'text', required: true },
      { id: 'model_hair_color', label: 'Hair Color', type: 'text', required: true },
      { id: 'model_eye_color', label: 'Eye Color', type: 'text', required: true },
      { id: 'model_experience', label: 'Modeling Experience', type: 'textarea', required: true },
      {
        id: 'model_categories',
        label: 'Modeling Categories',
        type: 'multicheck',
        options: [...MODELING_CATEGORIES],
        required: true,
      },
      { id: 'doc_model_headshot', label: 'Headshot', type: 'file_upload', required: true },
      { id: 'doc_model_fullbody', label: 'Full-body photo', type: 'file_upload', required: true },
      { id: 'doc_model_portfolio', label: 'Portfolio', type: 'file_upload', required: false },
      { id: 'doc_model_comp', label: 'Comp Card', type: 'file_upload', required: false },
      { id: 'model_website', label: 'Modeling Website', type: 'url', required: false },
    ],
  },
  {
    id: 'acting',
    label: 'Acting',
    icon: '',
    showIf: interest('Acting'),
    fields: [
      {
        id: 'acting_experience_level',
        label: 'Acting Experience Level',
        type: 'select',
        options: [...EXPERIENCE_LEVELS],
        required: true,
      },
      {
        id: 'acting_categories',
        label: 'Acting Categories',
        type: 'multicheck',
        options: [...ACTING_CATEGORIES],
        required: true,
      },
      { id: 'acting_training', label: 'Acting Training / Experience', type: 'textarea', required: false, minLength: 200, note: 'Optional — if provided, at least 200 characters' },
      { id: 'acting_credits', label: 'Notable Credits', type: 'textarea', required: false },
      { id: 'doc_acting_headshot', label: 'Headshot', type: 'file_upload', required: true },
      { id: 'doc_acting_resume', label: 'Resume', type: 'file_upload', required: false },
      { id: 'doc_acting_reel', label: 'Demo Reel', type: 'file_upload', required: false },
    ],
  },
  {
    id: 'sports',
    label: 'Sports & Athletics',
    icon: '',
    showIf: interest('Sports & Athletics'),
    fields: [
      { id: 'sport_primary', label: 'Primary Sport', type: 'text', required: true },
      { id: 'sport_position', label: 'Position / Event / Discipline', type: 'text', required: true },
      { id: 'sport_team', label: 'Current Team / Organization', type: 'text', required: false },
      { id: 'sport_level', label: 'Current Competitive Level', type: 'text', required: true },
      { id: 'sport_school', label: 'School / University', type: 'text', required: false },
      { id: 'sport_years', label: 'Years Competing', type: 'text', required: true },
      { id: 'sport_highlights', label: 'Career Highlights', type: 'textarea', required: true },
      { id: 'doc_sport_photo', label: 'Athletic Photo', type: 'file_upload', required: true },
      { id: 'doc_sport_reel', label: 'Highlight Reel', type: 'file_upload', required: false },
      { id: 'sport_ranking', label: 'Ranking', type: 'text', required: false },
      { id: 'sport_stats', label: 'Statistics', type: 'textarea', required: false },
      { id: 'sport_coach', label: 'Coach', type: 'text', required: false },
      { id: 'doc_sport_resume', label: 'Athletic Resume', type: 'file_upload', required: false },
    ],
  },
  {
    id: 'influencing',
    label: 'Influencing / Content',
    icon: '',
    showIf: interest('Influencing / Content Creation'),
    fields: [
      {
        id: 'influencer_primary_platform',
        label: 'Primary Platform',
        type: 'select',
        options: [...SOCIAL_PLATFORMS],
        required: true,
      },
      { id: 'influencer_handle', label: 'Username / Handle', type: 'text', required: true },
      {
        id: 'influencer_content_categories',
        label: 'Content Category',
        type: 'multicheck',
        options: [...INFLUENCER_CONTENT_CATEGORIES],
        required: true,
      },
      { id: 'influencer_followers', label: 'Approximate Follower Count', type: 'text', required: true },
      { id: 'influencer_avg_views', label: 'Approximate Average Views', type: 'text', required: false },
      { id: 'influencer_content_desc', label: 'Content Description', type: 'textarea', required: true },
      {
        id: 'influencer_brand_experience',
        label: 'Previous Brand Partnership Experience',
        type: 'textarea',
        required: false,
      },
    ],
  },
  {
    id: 'conflicts',
    label: 'Representation & Conflicts',
    icon: '',
    fields: [
      {
        id: 'currently_represented',
        label: 'Are you currently represented by another agency, manager, or representative?',
        type: 'select',
        options: [...YES_NO],
        required: true,
      },
      {
        id: 'rep_agency_name',
        label: 'Agency / Manager Name',
        type: 'text',
        requiredIf: equalsYes('currently_represented'),
        showIf: equalsYes('currently_represented'),
      },
      {
        id: 'rep_type',
        label: 'Type of Representation',
        type: 'text',
        requiredIf: equalsYes('currently_represented'),
        showIf: equalsYes('currently_represented'),
      },
      {
        id: 'rep_category',
        label: 'Category',
        type: 'text',
        requiredIf: equalsYes('currently_represented'),
        showIf: equalsYes('currently_represented'),
      },
      {
        id: 'rep_exclusive',
        label: 'Exclusive / Non-exclusive',
        type: 'select',
        options: [...REPRESENTATION_TYPES],
        requiredIf: equalsYes('currently_represented'),
        showIf: equalsYes('currently_represented'),
      },
      {
        id: 'rep_explanation',
        label: 'Brief explanation',
        type: 'textarea',
        requiredIf: equalsYes('currently_represented'),
        showIf: equalsYes('currently_represented'),
      },
      {
        id: 'has_conflicting_obligations',
        label:
          'Are you currently under any contract, exclusivity, sponsorship, endorsement, management agreement, or other professional obligation that could affect working with Nzinga?',
        type: 'select',
        options: [...YES_NO],
        required: true,
      },
      {
        id: 'conflict_explanation',
        label: 'Brief explanation',
        type: 'textarea',
        requiredIf: equalsYes('has_conflicting_obligations'),
        showIf: equalsYes('has_conflicting_obligations'),
      },
      {
        id: 'doc_conflict',
        label: 'Supporting documentation (optional)',
        type: 'file_upload',
        required: false,
        showIf: equalsYes('has_conflicting_obligations'),
      },
    ],
  },
  {
    id: 'availability',
    label: 'Availability',
    icon: '',
    fields: [
      {
        id: 'work_markets',
        label: 'Where are you interested in working?',
        type: 'multicheck',
        options: [...WORK_MARKETS],
        required: true,
      },
      {
        id: 'willing_to_travel',
        label: 'Are you willing to travel?',
        type: 'select',
        options: [...YES_NO],
        required: true,
      },
      {
        id: 'currently_available',
        label: 'Are you currently available for professional opportunities?',
        type: 'select',
        options: [...YES_NO],
        required: true,
      },
      {
        id: 'scheduling_restrictions',
        label: 'Any major scheduling restrictions?',
        type: 'textarea',
        required: false,
      },
    ],
  },
  {
    id: 'social',
    label: 'Social & Portfolio',
    icon: '',
    requireAnyOf: [['link_instagram', 'link_other']],
    fields: [
      { id: 'link_instagram', label: 'Instagram', type: 'url', required: false },
      { id: 'link_tiktok', label: 'TikTok', type: 'url', required: false },
      { id: 'link_youtube', label: 'YouTube', type: 'url', required: false },
      { id: 'link_website', label: 'Website', type: 'url', required: false },
      { id: 'link_portfolio', label: 'Portfolio', type: 'url', required: false },
      { id: 'link_other', label: 'Other link', type: 'url', required: false },
    ],
  },
  {
    id: 'id_verification',
    label: 'ID Verification',
    icon: '',
    fields: [
      {
        id: 'doc_gov_id',
        label: 'Government-Issued Photo ID',
        type: 'file_upload',
        required: true,
        note: 'Adults: passport, driver’s license, or state ID. Do not upload SSN.',
        showIf: { field: 'dob', equals: '__adult__' },
      },
      {
        id: 'id_note_minor',
        label:
          'As a minor applicant, your parent/guardian will upload government ID during their verification step.',
        type: 'checkbox',
        requiredIf: { field: 'dob', condition: 'minor' },
        showIf: { field: 'dob', condition: 'minor' },
      },
    ],
  },
  {
    id: 'final',
    label: 'Final & Signature',
    icon: '',
    fields: [
      {
        id: 'why_represent',
        label: 'Why do you want Nzinga to represent you?',
        type: 'textarea',
        required: true,
      },
      {
        id: 'goals_1_2_years',
        label: 'What are you hoping to accomplish over the next 1–2 years?',
        type: 'textarea',
        required: true,
      },
      {
        id: 'anything_else',
        label: 'Is there anything else you would like us to know?',
        type: 'textarea',
        required: false,
      },
      {
        id: 'consent_truth',
        label: 'I confirm all information provided is accurate and truthful.',
        type: 'checkbox',
        required: true,
      },
      {
        id: 'consent_contact',
        label: 'I agree to be contacted by Nzinga regarding my application.',
        type: 'checkbox',
        required: true,
      },
      {
        id: 'signature',
        label: 'Electronic Signature (Full Legal Name)',
        type: 'text',
        required: true,
      },
      {
        id: 'signature_date',
        label: 'Date',
        type: 'date',
        required: true,
      },
    ],
  },
]

export function ageFromDob(dob: string | undefined): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function isMinor(dob: string | undefined): boolean {
  const age = ageFromDob(dob)
  return age !== null && age < 18
}

function csvIncludes(value: string | boolean | undefined, needle: string): boolean {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(needle)
}

export function matchesCondition(
  data: ApplicationData,
  cond: AppFieldCondition | undefined,
): boolean {
  if (!cond) return true
  if ('condition' in cond && cond.condition === 'minor') {
    return isMinor(data[cond.field] as string | undefined)
  }
  if ('equals' in cond) {
    if (cond.equals === '__adult__') {
      const dob = data[cond.field] as string | undefined
      return Boolean(dob) && !isMinor(dob)
    }
    return String(data[cond.field] ?? '') === cond.equals
  }
  if ('includes' in cond) {
    return csvIncludes(data[cond.field], cond.includes)
  }
  return true
}

export function isSectionVisible(sec: AppSection, data: ApplicationData): boolean {
  return matchesCondition(data, sec.showIf)
}

export function isFieldVisible(field: AppField, data: ApplicationData): boolean {
  return matchesCondition(data, field.showIf)
}

export function getVisibleSections(data: ApplicationData): AppSection[] {
  return APP_SECTIONS.filter((s) => isSectionVisible(s, data))
}

function fieldIsRequired(field: AppField, data: ApplicationData): boolean {
  if (field.required) return true
  if (!field.requiredIf) return false
  return matchesCondition(data, field.requiredIf)
}

function fieldCharLength(value: string | boolean | undefined): number {
  if (typeof value !== 'string') return 0
  return value.trim().length
}

/** Returns true when a non-empty value fails min/max length rules. */
export function fieldFailsLength(field: AppField, data: ApplicationData): boolean {
  const len = fieldCharLength(data[field.id])
  if (len === 0) return false
  if (field.minLength != null && len < field.minLength) return true
  if (field.maxLength != null && len > field.maxLength) return true
  return false
}

export function fieldLengthHint(field: AppField, data: ApplicationData): string | null {
  const len = fieldCharLength(data[field.id])
  if (field.minLength == null && field.maxLength == null) return null
  if (field.minLength != null && field.maxLength != null) {
    return `${len} / ${field.minLength}–${field.maxLength} characters`
  }
  if (field.minLength != null) {
    return len === 0
      ? `Optional — min ${field.minLength} characters if provided`
      : `${len} / ${field.minLength}+ characters`
  }
  return `${len} / max ${field.maxLength} characters`
}

export function validateSection(secId: string, data: ApplicationData): string[] {
  const sec = APP_SECTIONS.find((s) => s.id === secId)
  if (!sec || !isSectionVisible(sec, data)) return []

  const missing = new Set<string>()

  for (const f of sec.fields) {
    if (!isFieldVisible(f, data)) continue
    const v = data[f.id]
    const required = fieldIsRequired(f, data)
    const empty =
      f.type === 'checkbox' ? !v : !v || (typeof v === 'string' && !v.trim())

    if (required && empty) {
      missing.add(f.id)
      continue
    }
    if (fieldFailsLength(f, data)) {
      missing.add(f.id)
    }
  }

  for (const group of sec.requireAnyOf || []) {
    const visibleIds = group.filter((id) => {
      const f = sec.fields.find((x) => x.id === id)
      return f ? isFieldVisible(f, data) : false
    })
    if (visibleIds.length === 0) continue
    const ok = visibleIds.some((id) => {
      const v = data[id]
      return typeof v === 'string' ? Boolean(v.trim()) : Boolean(v)
    })
    if (!ok) {
      for (const id of visibleIds) missing.add(id)
    }
  }

  return [...missing]
}

export function isAppComplete(app: Application | null | undefined): boolean {
  if (!app?.data) return false
  for (const sec of getVisibleSections(app.data)) {
    if (validateSection(sec.id, app.data).length > 0) return false
  }
  return true
}

function docFromApp(
  d: ApplicationData,
  id: string,
  fallbackName: string,
): UploadedDoc | null {
  const data = d[id]
  if (!data) return null
  return {
    name: String(d[`${id}_name`] || fallbackName),
    data: String(data),
    type: String(d[`${id}_type`] || 'application/octet-stream'),
    doc_type: id.replace(/^doc_/, ''),
    uploaded_at: new Date().toISOString(),
    uploaded_by: 'applicant',
    status: 'received',
  }
}

export function talentFromApp(app: Application, accountNumber = ''): Talent {
  const d = app.data || {}
  const niches = d.representation_interests
    ? String(d.representation_interests)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  const parentRequired = isMinor(d.dob as string | undefined) ? 'Yes' : 'No'
  const preferred = String(d.preferred_name || '')
  const legalName = [d.legal_first, d.legal_last].filter(Boolean).join(' ') || app.talent_name

  return {
    id: 't_app_' + app.id,
    account_number: accountNumber,
    name: preferred || legalName,
    first_name: String(d.legal_first || ''),
    last_name: String(d.legal_last || ''),
    stage_name: preferred,
    stage: 'holding_entry',
    niches,
    scout_id: null,
    created_by: null,
    created_at: new Date().toISOString(),
    phone: String(d.phone || ''),
    email: String(d.email || ''),
    secondary_phone: '',
    preferred_contact: '',
    gov_id_number: '',
    dob: String(d.dob || ''),
    roster_division: niches[0] || '',
    secondary_specialization: niches.slice(1).join(', '),
    earliest_availability: '',
    min_day_rate: '',
    contract_duration_pref: '',
    legal_minor_status: parentRequired,
    animal_skill_onset: '',
    travel_logistics: String(d.scheduling_restrictions || ''),
    applicant_stage_status: 'New / Lead',
    discovery_source: '',
    application_submitted_at: new Date().toISOString().split('T')[0],
    next_callback_date: '',
    prior_annual_revenue: '',
    current_agency: String(d.rep_agency_name || ''),
    union_affiliation: '',
    parent_guardian_required: String(parentRequired),
    onboarding_fee_status: '',
    reference_check_status: 'Not Started',
    height: String(d.model_height || ''),
    bust: '',
    waist: '',
    hips: '',
    shoe_size: String(d.model_shoe_size || ''),
    eye_color: String(d.model_eye_color || ''),
    scout_notes: String(d.about_yourself || ''),
    social_handle: String(d.influencer_handle || d.link_instagram || ''),
    follower_count: String(d.influencer_followers || ''),
    er_pct: '',
    platform: String(d.influencer_primary_platform || ''),
    location: [d.city, d.state, d.country].filter(Boolean).join(', '),
    pillar_scores: [0, 0, 0, 0, 0],
    pillar_rationales: ['', '', '', '', ''],
    jordan_score: 0,
    revenue_path: String(d.career_goals || ''),
    scout_summary: String(d.about_yourself || ''),
    team1_notes: '',
    team1_decision: null,
    compliance: {
      legal_name: !!(d.legal_first && d.legal_last),
      dob: !!d.dob,
      address: !!(d.city && d.state),
      email_phone: !!(d.email && d.phone),
      gov_id: !!d.doc_gov_id || app.guardian_status === 'completed',
      tax_doc: false,
      banking: false,
      social_ownership: !!(d.influencer_handle || d.link_instagram || d.link_tiktok),
    },
    rep_type: '',
    commission: '',
    term_length: '',
    team2_notes: '',
    team2_decision: null,
    director_decision: null,
    portal_setup: false,
    technical_routing: false,
    warm_handoff: '',
    warm_handoff_confirmed: false,
    revenue_ytd: '0',
    revenue_projected: '0',
    last_contacted: new Date().toISOString().split('T')[0],
    application_id: app.id,
    application_status: app.status === 'pending_guardian' ? 'pending_guardian' : 'submitted',
    uploaded_docs: {
      profile_photo: docFromApp(d, 'doc_profile_photo', 'Profile Photo'),
      gov_id: docFromApp(d, 'doc_gov_id', 'Government ID'),
      headshot:
        docFromApp(d, 'doc_model_headshot', 'Modeling Headshot') ||
        docFromApp(d, 'doc_acting_headshot', 'Acting Headshot'),
      fullbody: docFromApp(d, 'doc_model_fullbody', 'Full-body Photo'),
      portfolio: docFromApp(d, 'doc_model_portfolio', 'Portfolio'),
      comp_card: docFromApp(d, 'doc_model_comp', 'Comp Card'),
      resume:
        docFromApp(d, 'doc_acting_resume', 'Acting Resume') ||
        docFromApp(d, 'doc_sport_resume', 'Athletic Resume'),
      reel:
        docFromApp(d, 'doc_acting_reel', 'Demo Reel') ||
        docFromApp(d, 'doc_sport_reel', 'Highlight Reel'),
      athletic_photo: docFromApp(d, 'doc_sport_photo', 'Athletic Photo'),
      conflict_docs: docFromApp(d, 'doc_conflict', 'Conflict Documentation'),
      tax_doc: null,
      banking: null,
      proof_income: null,
    },
    audit_log: [
      {
        user: app.talent_name,
        role: 'Prospect',
        action:
          app.status === 'pending_guardian'
            ? 'Submitted application — pending guardian verification'
            : 'Submitted application — auto-created New / Lead record',
        stage: 'holding_entry',
        ts: new Date().toISOString(),
      },
    ],
  }
}
