import type { AppSection, Application, ApplicationData, Talent } from '@/types'

export const APP_SECTIONS: AppSection[] = [
  {
    id: 'personal',
    label: 'Personal Information',
    icon: '👤',
    fields: [
      { id: 'legal_first', label: 'Legal First Name', type: 'text', required: true },
      { id: 'legal_last', label: 'Legal Last Name', type: 'text', required: true },
      { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { id: 'email', label: 'Email Address', type: 'email', required: true },
      { id: 'address', label: 'Mailing Address', type: 'text', required: true },
      { id: 'city', label: 'City', type: 'text', required: true },
      { id: 'state', label: 'State', type: 'text', required: true },
      { id: 'zip', label: 'ZIP Code', type: 'text', required: true },
      { id: 'parent_name', label: 'Parent/Guardian Full Name', type: 'text', requiredIf: { field: 'dob', condition: 'minor' } },
      { id: 'parent_phone', label: 'Parent/Guardian Phone', type: 'tel', requiredIf: { field: 'dob', condition: 'minor' } },
      { id: 'parent_email', label: 'Parent/Guardian Email', type: 'email', requiredIf: { field: 'dob', condition: 'minor' } },
      { id: 'parent_relationship', label: 'Relationship to Applicant', type: 'select', options: ['Parent', 'Legal Guardian', 'Other'], requiredIf: { field: 'dob', condition: 'minor' } },
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
    label: 'Talent & Niche',
    icon: '⭐',
    fields: [
      {
        id: 'niches',
        label: 'Primary Niche(s)',
        type: 'multicheck',
        options: [
          'Model',
          'Actor',
          'Influencer',
          'Athlete',
        ],
        required: true,
      },
      { id: 'bio', label: 'Short Bio (2–3 sentences)', type: 'textarea', required: true },
      { id: 'achievements', label: 'Key Achievements / Credits', type: 'textarea', required: true },
      { id: 'collab_brands', label: 'Past Brand Collaborations', type: 'textarea', required: false },
    ],
  },
  {
    id: 'business',
    label: 'Business & Goals',
    icon: '💼',
    fields: [
      { id: 'goals_90day', label: '90-Day Goals', type: 'textarea', required: true },
      { id: 'goals_1year', label: '1-Year Vision', type: 'textarea', required: false },
      {
        id: 'rep_type_pref',
        label: 'Representation Preference',
        type: 'select',
        options: ['Exclusive', 'Non-Exclusive', 'Open to Discussion'],
        required: false,
      },
      { id: 'referred_by', label: 'How did you hear about us?', type: 'text', required: false },
    ],
  },
  {
    id: 'documents',
    label: 'Required Documents',
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
        note: 'IRS W-9 form',
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

export function talentFromApp(app: Application): Talent {
  const d = app.data || {}
  const niches = d.niches
    ? String(d.niches)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  return {
    id: 't_app_' + app.id,
    name: [d.legal_first, d.legal_last].filter(Boolean).join(' ') || app.talent_name,
    stage: 'holding_entry',
    niches,
    scout_id: null,
    created_by: null,
    created_at: new Date().toISOString(),
    social_handle: String(d.primary_handle || ''),
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
        : d.rep_type_pref === 'Non-Exclusive'
          ? 'Non-Exclusive'
          : '',
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
