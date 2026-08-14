import type { AppSection, Application, ApplicationData, Talent } from '@/types'
import {
  ROSTER_DIVISIONS,
  SECONDARY_SPECIALIZATIONS,
  CONTRACT_DURATION_PREFS,
  DISCOVERY_SOURCES,
  PREFERRED_OUTREACH_CHANNELS,
  UNION_AFFILIATIONS,
  YES_NO,
} from './applicant-fields'

export const APP_SECTIONS: AppSection[] = [
  {
    id: 'personal',
    label: 'Basic Information',
    icon: '👤',
    fields: [
      { id: 'legal_first', label: 'Talent First Name', type: 'text', required: true },
      { id: 'legal_last', label: 'Talent Last Name', type: 'text', required: true },
      { id: 'stage_name', label: 'Stage Name / Alias', type: 'text', required: false },
      { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { id: 'phone', label: 'Mobile Phone Number', type: 'tel', required: true },
      { id: 'secondary_phone', label: 'Secondary Contact Line', type: 'tel', required: false },
      { id: 'email', label: 'Talent Email Address', type: 'email', required: true },
      {
        id: 'preferred_contact',
        label: 'Preferred Outreach Channel',
        type: 'select',
        options: [...PREFERRED_OUTREACH_CHANNELS],
        required: false,
      },
      { id: 'address', label: 'Primary Base / Address', type: 'text', required: true },
      { id: 'city', label: 'City', type: 'text', required: true },
      { id: 'state', label: 'State', type: 'text', required: true },
      { id: 'zip', label: 'ZIP Code', type: 'text', required: true },
      {
        id: 'gov_id_number',
        label: 'Government ID / Passport #',
        type: 'text',
        required: false,
      },
      {
        id: 'parent_name',
        label: 'Parent/Guardian Full Name',
        type: 'text',
        requiredIf: { field: 'dob', condition: 'minor' },
      },
      {
        id: 'parent_phone',
        label: 'Parent/Guardian Phone',
        type: 'tel',
        requiredIf: { field: 'dob', condition: 'minor' },
      },
      {
        id: 'parent_email',
        label: 'Parent/Guardian Email',
        type: 'email',
        requiredIf: { field: 'dob', condition: 'minor' },
      },
      {
        id: 'parent_relationship',
        label: 'Relationship to Applicant',
        type: 'select',
        options: ['Parent', 'Legal Guardian', 'Other'],
        requiredIf: { field: 'dob', condition: 'minor' },
      },
    ],
  },
  {
    id: 'social',
    label: 'Social Media Profiles',
    icon: '📱',
    fields: [
      { id: 'primary_handle', label: 'Primary Handle (@username)', type: 'text', required: true },
      {
        id: 'primary_platform',
        label: 'Primary Platform',
        type: 'select',
        options: ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Facebook', 'Twitch', 'Other'],
        required: true,
      },
      { id: 'follower_count', label: 'Follower / Subscriber Count', type: 'text', required: true },
      { id: 'er_pct', label: 'Avg Engagement Rate (%)', type: 'text', required: false },
      { id: 'secondary_handle', label: 'Secondary Handle (optional)', type: 'text', required: false },
      { id: 'website', label: 'Personal Website / Portfolio', type: 'url', required: false },
    ],
  },
  {
    id: 'talent',
    label: 'Roster & Casting Preferences',
    icon: '⭐',
    fields: [
      {
        id: 'roster_division',
        label: 'Primary Roster Division',
        type: 'select',
        options: [...ROSTER_DIVISIONS],
        required: false,
      },
      {
        id: 'secondary_specialization',
        label: 'Secondary Specialization',
        type: 'select',
        options: [...SECONDARY_SPECIALIZATIONS],
        required: false,
      },
      {
        id: 'niches',
        label: 'Primary Niche(s)',
        type: 'multicheck',
        options: ['Model', 'Actor', 'Influencer', 'Athlete'],
        required: true,
      },
      {
        id: 'earliest_availability',
        label: 'Earliest Availability Date',
        type: 'date',
        required: false,
      },
      {
        id: 'min_day_rate',
        label: 'Minimum Day Rate / Target Earnings',
        type: 'text',
        required: false,
      },
      {
        id: 'contract_duration_pref',
        label: 'Contract Duration Preference',
        type: 'select',
        options: [...CONTRACT_DURATION_PREFS],
        required: false,
      },
      {
        id: 'travel_logistics',
        label: 'Travel & Logistics Constraints',
        type: 'text',
        required: false,
      },
      {
        id: 'animal_skill_onset',
        label: 'Animal / Exotic Skill On-Set',
        type: 'text',
        required: false,
      },
      { id: 'bio', label: 'Short Bio (2–3 sentences)', type: 'textarea', required: true },
      { id: 'achievements', label: 'Key Achievements / Credits', type: 'textarea', required: true },
      { id: 'collab_brands', label: 'Past Brand Collaborations', type: 'textarea', required: false },
    ],
  },
  {
    id: 'business',
    label: 'Background & Goals',
    icon: '💼',
    fields: [
      { id: 'goals_90day', label: '90-Day Goals', type: 'textarea', required: true },
      { id: 'goals_1year', label: '1-Year Vision', type: 'textarea', required: false },
      {
        id: 'union_affiliation',
        label: 'Union Affiliation Status',
        type: 'select',
        options: [...UNION_AFFILIATIONS],
        required: false,
      },
      {
        id: 'current_agency',
        label: 'Current Non-Exclusive Agency',
        type: 'text',
        required: false,
      },
      {
        id: 'prior_annual_revenue',
        label: 'Prior Annual Booking Revenue',
        type: 'text',
        required: false,
      },
      {
        id: 'parent_guardian_required',
        label: 'Parent / Guardian Required?',
        type: 'select',
        options: [...YES_NO],
        required: false,
      },
      {
        id: 'rep_type_pref',
        label: 'Representation Preference',
        type: 'select',
        options: ['Exclusive', 'Non-Exclusive', 'Open to Discussion'],
        required: false,
      },
      {
        id: 'referred_by',
        label: 'Discovery Source',
        type: 'select',
        options: [...DISCOVERY_SOURCES],
        required: false,
      },
    ],
  },
  {
    id: 'specs',
    label: 'Physical Specs & Media Notes',
    icon: '📏',
    fields: [
      { id: 'height', label: 'Height', type: 'text', required: false },
      { id: 'bust', label: 'Bust', type: 'text', required: false },
      { id: 'waist', label: 'Waist', type: 'text', required: false },
      { id: 'hips', label: 'Hips', type: 'text', required: false },
      { id: 'shoe_size', label: 'Shoe Size', type: 'text', required: false },
      { id: 'eye_color', label: 'Eye Color', type: 'text', required: false },
      {
        id: 'scout_notes_public',
        label: 'Additional Notes for Scouts',
        type: 'textarea',
        required: false,
      },
    ],
  },
  {
    id: 'documents',
    label: 'Portfolio, Digitals & Documents',
    icon: '📎',
    fields: [
      {
        id: 'doc_gov_id',
        label: 'Government-Issued ID',
        type: 'file_upload',
        required: true,
        note: "Passport, driver's license, or state ID",
      },
      {
        id: 'doc_tax',
        label: 'Tax Documentation (W-9)',
        type: 'file_upload',
        required: true,
        note: 'IRS W-9 form — SSN/Tax ID encrypted at processing',
      },
      {
        id: 'doc_banking',
        label: 'Banking Information',
        type: 'file_upload',
        required: true,
        note: 'Voided check or bank statement',
      },
      {
        id: 'doc_proof_income',
        label: 'Proof of Income',
        type: 'file_upload',
        required: true,
        note: 'For self-support verification only — not used in approval decisions',
      },
      {
        id: 'doc_headshot',
        label: 'Headshot / Digitals',
        type: 'file_upload',
        required: false,
        note: 'Polaroids, digitals, or headshots',
      },
      {
        id: 'doc_reel',
        label: 'Video Reel',
        type: 'file_upload',
        required: false,
        note: 'Acting or modeling reel',
      },
      {
        id: 'doc_resume',
        label: 'Acting Resume / Portfolio',
        type: 'file_upload',
        required: false,
      },
    ],
  },
  {
    id: 'consent',
    label: 'Agreements & Consent',
    icon: '📋',
    fields: [
      {
        id: 'consent_data',
        label:
          'I consent to Nzinga Talent Group storing and processing my personal data for talent evaluation purposes.',
        type: 'checkbox',
        required: true,
      },
      {
        id: 'consent_contact',
        label:
          'I agree to be contacted by Nzinga scouts and team members regarding my application.',
        type: 'checkbox',
        required: true,
      },
      {
        id: 'consent_truth',
        label: 'I confirm all information provided is accurate and truthful.',
        type: 'checkbox',
        required: true,
      },
      {
        id: 'signature',
        label: 'Full Legal Name (as digital signature)',
        type: 'text',
        required: true,
      },
    ],
  },
]

function isMinor(dob: string | undefined): boolean {
  if (!dob) return false
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age < 18
}

export function validateSection(secId: string, data: ApplicationData): string[] {
  const sec = APP_SECTIONS.find((s) => s.id === secId)
  if (!sec) return []
  return sec.fields
    .filter((f) => {
      if (f.required) return true
      if (f.requiredIf?.condition === 'minor') {
        return isMinor(data[f.requiredIf.field] as string | undefined)
      }
      return false
    })
    .filter((f) => {
      const v = data[f.id]
      if (!v) return true
      if (typeof v === 'string' && !v.trim()) return true
      return false
    })
    .map((f) => f.id)
}

export function isAppComplete(app: Application | null | undefined): boolean {
  if (!app?.data) return false
  for (const sec of APP_SECTIONS) {
    if (validateSection(sec.id, app.data).length > 0) return false
  }
  return true
}

export function talentFromApp(app: Application, accountNumber = ''): Talent {
  const d = app.data || {}
  const niches = d.niches
    ? String(d.niches)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  if (d.roster_division && !niches.includes(String(d.roster_division))) {
    niches.unshift(String(d.roster_division))
  }
  if (d.secondary_specialization && !niches.includes(String(d.secondary_specialization))) {
    niches.push(String(d.secondary_specialization))
  }

  const parentRequired =
    typeof d.parent_guardian_required === 'string' && d.parent_guardian_required
      ? d.parent_guardian_required
      : isMinor(d.dob as string | undefined)
        ? 'Yes'
        : 'No'

  return {
    id: 't_app_' + app.id,
    account_number: accountNumber,
    name: [d.legal_first, d.legal_last].filter(Boolean).join(' ') || app.talent_name,
    first_name: String(d.legal_first || ''),
    last_name: String(d.legal_last || ''),
    stage_name: String(d.stage_name || d.primary_handle || ''),
    stage: 'holding_entry',
    niches,
    scout_id: null,
    created_by: null,
    created_at: new Date().toISOString(),
    phone: String(d.phone || ''),
    email: String(d.email || ''),
    secondary_phone: String(d.secondary_phone || ''),
    preferred_contact: String(d.preferred_contact || ''),
    gov_id_number: String(d.gov_id_number || ''),
    dob: String(d.dob || ''),
    roster_division: String(d.roster_division || ''),
    secondary_specialization: String(d.secondary_specialization || ''),
    earliest_availability: String(d.earliest_availability || ''),
    min_day_rate: String(d.min_day_rate || ''),
    contract_duration_pref: String(d.contract_duration_pref || d.rep_type_pref || ''),
    legal_minor_status: parentRequired,
    animal_skill_onset: String(d.animal_skill_onset || ''),
    travel_logistics: String(d.travel_logistics || ''),
    applicant_stage_status: 'New Inquiry',
    discovery_source: String(d.referred_by || ''),
    application_submitted_at: new Date().toISOString().split('T')[0],
    next_callback_date: '',
    prior_annual_revenue: String(d.prior_annual_revenue || ''),
    current_agency: String(d.current_agency || ''),
    union_affiliation: String(d.union_affiliation || ''),
    parent_guardian_required: String(parentRequired),
    onboarding_fee_status: '',
    reference_check_status: 'Not Started',
    height: String(d.height || ''),
    bust: String(d.bust || ''),
    waist: String(d.waist || ''),
    hips: String(d.hips || ''),
    shoe_size: String(d.shoe_size || ''),
    eye_color: String(d.eye_color || ''),
    scout_notes: String(d.scout_notes_public || d.bio || ''),
    social_handle: String(d.primary_handle || d.stage_name || ''),
    follower_count: String(d.follower_count || ''),
    er_pct: String(d.er_pct || ''),
    platform: String(d.primary_platform || ''),
    location: [d.city, d.state].filter(Boolean).join(', '),
    pillar_scores: [0, 0, 0, 0, 0],
    pillar_rationales: ['', '', '', '', ''],
    jordan_score: 0,
    revenue_path: String(d.goals_90day || ''),
    scout_summary: String(d.bio || ''),
    team1_notes: '',
    team1_decision: null,
    compliance: {
      legal_name: !!(d.legal_first && d.legal_last),
      dob: !!d.dob,
      address: !!(d.address && d.city),
      email_phone: !!(d.email && d.phone),
      gov_id: !!d.doc_gov_id,
      tax_doc: !!d.doc_tax,
      banking: !!d.doc_banking,
      social_ownership: !!d.primary_handle,
    },
    rep_type:
      d.rep_type_pref === 'Exclusive'
        ? 'Exclusive'
        : d.rep_type_pref === 'Non-Exclusive' || d.contract_duration_pref === 'Non-Exclusive'
          ? 'Non-Exclusive'
          : '',
    commission: '',
    term_length: String(d.contract_duration_pref || ''),
    team2_notes: '',
    team2_decision: null,
    director_decision: null,
    portal_setup: false,
    technical_routing: false,
    warm_handoff: '',
    warm_handoff_confirmed: false,
    revenue_ytd: '0',
    revenue_projected: String(d.min_day_rate || '0'),
    last_contacted: new Date().toISOString().split('T')[0],
    application_id: app.id,
    application_status: 'submitted',
    uploaded_docs: {
      gov_id: d.doc_gov_id
        ? {
            name: String(d.doc_gov_id_name || 'Government ID'),
            data: String(d.doc_gov_id),
            type: String(d.doc_gov_id_type || 'image/jpeg'),
          }
        : null,
      tax_doc: d.doc_tax
        ? {
            name: String(d.doc_tax_name || 'W-9 Form'),
            data: String(d.doc_tax),
            type: String(d.doc_tax_type || 'application/pdf'),
          }
        : null,
      banking: d.doc_banking
        ? {
            name: String(d.doc_banking_name || 'Banking Info'),
            data: String(d.doc_banking),
            type: String(d.doc_banking_type || 'image/jpeg'),
          }
        : null,
      proof_income: d.doc_proof_income
        ? {
            name: String(d.doc_proof_income_name || 'Proof of Income'),
            data: String(d.doc_proof_income),
            type: String(d.doc_proof_income_type || 'image/jpeg'),
          }
        : null,
      headshot: d.doc_headshot
        ? {
            name: String(d.doc_headshot_name || 'Headshot'),
            data: String(d.doc_headshot),
            type: String(d.doc_headshot_type || 'image/jpeg'),
          }
        : null,
      reel: d.doc_reel
        ? {
            name: String(d.doc_reel_name || 'Video Reel'),
            data: String(d.doc_reel),
            type: String(d.doc_reel_type || 'video/mp4'),
          }
        : null,
      resume: d.doc_resume
        ? {
            name: String(d.doc_resume_name || 'Resume'),
            data: String(d.doc_resume),
            type: String(d.doc_resume_type || 'application/pdf'),
          }
        : null,
    },
    audit_log: [
      {
        user: app.talent_name,
        role: 'Prospect',
        action: 'Submitted application — auto-created holding record',
        stage: 'holding_entry',
        ts: new Date().toISOString(),
      },
    ],
  }
}
