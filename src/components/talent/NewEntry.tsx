// @ts-nocheck
import { useState } from 'react'
import {
  USERS,
  ROLE_LABELS,
  REQUIRED_DOCS,
  ROSTER_DIVISIONS,
  SECONDARY_SPECIALIZATIONS,
  CONTRACT_DURATION_PREFS,
  APPLICANT_STAGE_STATUSES,
  DISCOVERY_SOURCES,
  PREFERRED_OUTREACH_CHANNELS,
  UNION_AFFILIATIONS,
  REFERENCE_CHECK_STATUSES,
  YES_NO,
  MEDIA_UPLOAD_TYPES,
} from '@/constants'
import { T, Btn, Lbl, FInput, FTextarea, FSelect, FileUpload } from '@/components/ui-compat'

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  stage_name: '',
  email: '',
  phone: '',
  secondary_phone: '',
  preferred_contact: 'Email',
  city: '',
  state: '',
  gov_id_number: '',
  dob: '',
  roster_division: '',
  secondary_specialization: '',
  earliest_availability: '',
  min_day_rate: '',
  contract_duration_pref: '',
  legal_minor_status: 'No',
  animal_skill_onset: '',
  travel_logistics: '',
  applicant_stage_status: 'New / Lead',
  scout_id: '',
  discovery_source: '',
  next_callback_date: '',
  prior_annual_revenue: '',
  current_agency: '',
  union_affiliation: 'Non-Union',
  parent_guardian_required: 'No',
  onboarding_fee_status: '',
  reference_check_status: 'Not Started',
  height: '',
  bust: '',
  waist: '',
  hips: '',
  shoe_size: '',
  eye_color: '',
  scout_notes: '',
  social_handle: '',
  follower_count: '',
  er_pct: '',
  platform: '',
}

function SectionHeader({ title }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderBottom: '2px solid ' + T.purple,
        background: '#f8f9fb',
        margin: '0 -14px 14px',
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: T.t1,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {title}
      </span>
    </div>
  )
}

function Field({ label, required, children, full }) {
  return (
    <div style={full ? { gridColumn: '1 / -1' } : undefined}>
      <Lbl required={required}>{label}</Lbl>
      {children}
    </div>
  )
}

function NewEntry({ currentUser, onSave, onCancel, onSendApp }) {
  const [entryType, setEntryType] = useState('manual')
  const [f, setF] = useState({
    ...EMPTY_FORM,
    scout_id: currentUser?.id || '',
  })
  const [docs, setDocs] = useState({})
  const [media, setMedia] = useState({})
  const [err, setErr] = useState('')

  const p = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const saveDoc = (docId, data, name, type) =>
    setDocs((x) => ({ ...x, [docId]: { data, name, type } }))
  const saveMedia = (docId, data, name, type) =>
    setMedia((x) => ({ ...x, [docId]: { data, name, type } }))

  const agentOptions = USERS.filter((u) =>
    ['scout', 'director', 'success_manager'].includes(u.role),
  )

  function fullName() {
    return [f.first_name, f.last_name].filter(Boolean).join(' ').trim()
  }

  function validateRequired() {
    if (!f.first_name || !f.last_name || !f.phone || !f.email || !f.city || !f.state) {
      setErr('First name, last name, email, mobile phone, city, and state are required.')
      return false
    }
    setErr('')
    return true
  }

  function buildTalent() {
    const name = fullName()
    const location = [f.city, f.state].filter(Boolean).join(', ')
    const scoutId = f.scout_id || currentUser.id
    const niches = [f.roster_division, f.secondary_specialization].filter(Boolean)
    return {
      id: 't' + Date.now(),
      name,
      first_name: f.first_name,
      last_name: f.last_name,
      stage_name: f.stage_name,
      phone: f.phone,
      email: f.email,
      secondary_phone: f.secondary_phone,
      preferred_contact: f.preferred_contact,
      city: f.city,
      state: f.state,
      location,
      gov_id_number: f.gov_id_number,
      dob: f.dob,
      roster_division: f.roster_division,
      secondary_specialization: f.secondary_specialization,
      niches,
      earliest_availability: f.earliest_availability,
      min_day_rate: f.min_day_rate,
      contract_duration_pref: f.contract_duration_pref,
      term_length: f.contract_duration_pref || '',
      legal_minor_status: f.legal_minor_status,
      animal_skill_onset: f.animal_skill_onset,
      travel_logistics: f.travel_logistics,
      applicant_stage_status: f.applicant_stage_status,
      discovery_source: f.discovery_source,
      application_submitted_at: new Date().toISOString().split('T')[0],
      next_callback_date: f.next_callback_date,
      prior_annual_revenue: f.prior_annual_revenue,
      current_agency: f.current_agency,
      union_affiliation: f.union_affiliation,
      parent_guardian_required: f.parent_guardian_required,
      onboarding_fee_status: f.onboarding_fee_status,
      reference_check_status: f.reference_check_status,
      height: f.height,
      bust: f.bust,
      waist: f.waist,
      hips: f.hips,
      shoe_size: f.shoe_size,
      eye_color: f.eye_color,
      scout_notes: f.scout_notes,
      social_handle: f.social_handle || f.stage_name || '',
      follower_count: f.follower_count,
      er_pct: f.er_pct,
      platform: f.platform || f.discovery_source || '',
      stage: 'holding_entry',
      scout_id: scoutId,
      created_at: new Date().toISOString(),
      last_contacted: new Date().toISOString().split('T')[0],
      created_by: currentUser.id,
      pillar_scores: [0, 0, 0, 0, 0],
      pillar_rationales: ['', '', '', '', ''],
      jordan_score: 0,
      revenue_path: '',
      scout_summary: f.scout_notes || '',
      team1_notes: '',
      team1_decision: null,
      compliance: {
        gov_id: !!docs.gov_id,
        tax_doc: !!docs.tax_doc,
        banking: !!docs.banking,
      },
      rep_type: f.contract_duration_pref === 'Non-Exclusive' ? 'Non-Exclusive' : '',
      commission: '',
      team2_notes: '',
      team2_decision: null,
      director_decision: null,
      portal_setup: false,
      technical_routing: false,
      warm_handoff: '',
      warm_handoff_confirmed: false,
      revenue_ytd: '0',
      revenue_projected: f.min_day_rate || '0',
      application_id: null,
      application_status: null,
      uploaded_docs: { ...docs, ...media },
      audit_log: [
        {
          user: currentUser.name,
          role: ROLE_LABELS[currentUser.role],
          action: 'Created talent applicant record',
          stage: 'holding_entry',
          ts: new Date().toISOString(),
        },
      ],
    }
  }

  function save() {
    if (!validateRequired()) return
    onSave(buildTalent())
  }

  function saveAndSend() {
    if (!validateRequired()) return
    const t = buildTalent()
    onSave(t)
    if (onSendApp) onSendApp(t)
  }

  const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }

  return (
    <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.t1, marginBottom: 4 }}>
            Add New Talent Applicant
          </div>
          <div style={{ fontSize: 12, color: T.t3 }}>
            Log a new talent applicant / candidate applying for Nzinga representation.
          </div>
        </div>

        <div style={{ marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['manual', '🖊', 'Manual Entry', 'Scout fills applicant details'],
            ['send_app', '📧', 'Send Application', 'Prospect completes their form'],
          ].map(([v, icon, label, desc]) => (
            <div
              key={v}
              onClick={() => setEntryType(v)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: `2px solid ${entryType === v ? T.purple : '#e5e7eb'}`,
                background: entryType === v ? T.purpleL : '#fff',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: entryType === v ? T.purple : T.t1,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 11, color: T.t3 }}>{desc}</div>
            </div>
          ))}
        </div>

        {err && (
          <div
            style={{
              background: T.redL,
              border: `1px solid ${T.red}44`,
              borderRadius: 6,
              padding: '8px 12px',
              color: T.red,
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            ⚠ {err}
          </div>
        )}

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 14 }}>
            {/* BASIC INFORMATION */}
            <SectionHeader title="Basic Information" />
            <div style={grid}>
              <Field label="Talent First Name" required>
                <FInput value={f.first_name} onChange={(v) => p('first_name', v)} placeholder="Alex" />
              </Field>
              <Field label="Talent Last Name" required>
                <FInput value={f.last_name} onChange={(v) => p('last_name', v)} placeholder="Rivera" />
              </Field>
              <Field label="Stage Name / Alias">
                <FInput
                  value={f.stage_name}
                  onChange={(v) => p('stage_name', v)}
                  placeholder="@handle or professional alias"
                />
              </Field>
              <Field label="Preferred Outreach Channel">
                <FSelect
                  value={f.preferred_contact}
                  onChange={(v) => p('preferred_contact', v)}
                  options={['', ...PREFERRED_OUTREACH_CHANNELS]}
                />
              </Field>
              <Field label="Talent Email Address" required>
                <FInput
                  value={f.email}
                  onChange={(v) => p('email', v)}
                  placeholder="talent@email.com"
                  type="email"
                />
              </Field>
              <Field label="Mobile Phone Number" required>
                <FInput
                  value={f.phone}
                  onChange={(v) => p('phone', v)}
                  placeholder="(555) 000-0000"
                  type="tel"
                />
              </Field>
              <Field label="Secondary Contact Line">
                <FInput
                  value={f.secondary_phone}
                  onChange={(v) => p('secondary_phone', v)}
                  placeholder="(555) 000-0001"
                  type="tel"
                />
              </Field>
              <Field label="Date of Birth">
                <FInput value={f.dob} onChange={(v) => p('dob', v)} type="date" />
              </Field>
              <Field label="Primary Base — City" required>
                <FInput value={f.city} onChange={(v) => p('city', v)} placeholder="Atlanta" />
              </Field>
              <Field label="Primary Base — State" required>
                <FInput value={f.state} onChange={(v) => p('state', v)} placeholder="GA" />
              </Field>
              <Field label="Government ID / Passport #" full>
                <FInput
                  value={f.gov_id_number}
                  onChange={(v) => p('gov_id_number', v)}
                  placeholder="ID or passport number"
                />
              </Field>
            </div>

            {/* ROSTER & CASTING PREFERENCES */}
            <SectionHeader title="Roster & Casting Preferences" />
            <div style={grid}>
              <Field label="Primary Roster Division">
                <FSelect
                  value={f.roster_division}
                  onChange={(v) => p('roster_division', v)}
                  options={['', ...ROSTER_DIVISIONS]}
                />
              </Field>
              <Field label="Secondary Specialization">
                <FSelect
                  value={f.secondary_specialization}
                  onChange={(v) => p('secondary_specialization', v)}
                  options={['', ...SECONDARY_SPECIALIZATIONS]}
                />
              </Field>
              <Field label="Earliest Availability Date">
                <FInput
                  value={f.earliest_availability}
                  onChange={(v) => p('earliest_availability', v)}
                  type="date"
                />
              </Field>
              <Field label="Minimum Day Rate / Target Earnings">
                <FInput
                  value={f.min_day_rate}
                  onChange={(v) => p('min_day_rate', v)}
                  placeholder="$500 / day"
                />
              </Field>
              <Field label="Contract Duration Preference">
                <FSelect
                  value={f.contract_duration_pref}
                  onChange={(v) => p('contract_duration_pref', v)}
                  options={['', ...CONTRACT_DURATION_PREFS]}
                />
              </Field>
              <Field label="Legal Minor / Guardian Status">
                <FSelect
                  value={f.legal_minor_status}
                  onChange={(v) => p('legal_minor_status', v)}
                  options={[...YES_NO]}
                />
              </Field>
              <Field label="Animal / Exotic Skill On-Set">
                <FInput
                  value={f.animal_skill_onset}
                  onChange={(v) => p('animal_skill_onset', v)}
                  placeholder="Comfort / experience with animals"
                />
              </Field>
              <Field label="Travel & Logistics Constraints">
                <FInput
                  value={f.travel_logistics}
                  onChange={(v) => p('travel_logistics', v)}
                  placeholder="Vehicle, license, travel willingness"
                />
              </Field>
            </div>

            {/* SCOUTING & PIPELINE STATUS */}
            <SectionHeader title="Scouting & Pipeline Status" />
            <div style={grid}>
              <Field label="Applicant Stage Status">
                <FSelect
                  value={f.applicant_stage_status}
                  onChange={(v) => p('applicant_stage_status', v)}
                  options={[...APPLICANT_STAGE_STATUSES]}
                />
              </Field>
              <Field label="Assigned Scout / Booking Agent">
                <FSelect
                  value={f.scout_id}
                  onChange={(v) => p('scout_id', v)}
                  options={[
                    { v: '', l: '— Select —' },
                    ...agentOptions.map((u) => ({ v: u.id, l: `${u.name} (${ROLE_LABELS[u.role]})` })),
                  ]}
                />
              </Field>
              <Field label="Discovery Source">
                <FSelect
                  value={f.discovery_source}
                  onChange={(v) => p('discovery_source', v)}
                  options={['', ...DISCOVERY_SOURCES]}
                />
              </Field>
              <Field label="Next Action / Callback Date">
                <FInput
                  value={f.next_callback_date}
                  onChange={(v) => p('next_callback_date', v)}
                  type="date"
                />
              </Field>
            </div>

            {/* BACKGROUND & SKILLS */}
            <SectionHeader title="Background & Skills" />
            <div style={grid}>
              <Field label="Union Affiliation Status">
                <FSelect
                  value={f.union_affiliation}
                  onChange={(v) => p('union_affiliation', v)}
                  options={[...UNION_AFFILIATIONS]}
                />
              </Field>
              <Field label="Parent / Guardian Required?">
                <FSelect
                  value={f.parent_guardian_required}
                  onChange={(v) => p('parent_guardian_required', v)}
                  options={[...YES_NO]}
                />
              </Field>
              <Field label="Reference & Background Check">
                <FSelect
                  value={f.reference_check_status}
                  onChange={(v) => p('reference_check_status', v)}
                  options={[...REFERENCE_CHECK_STATUSES]}
                />
              </Field>
              <Field label="Prior Annual Booking Revenue">
                <FInput
                  value={f.prior_annual_revenue}
                  onChange={(v) => p('prior_annual_revenue', v)}
                  placeholder="$25,000"
                />
              </Field>
              <Field label="Current Non-Exclusive Agency">
                <FInput
                  value={f.current_agency}
                  onChange={(v) => p('current_agency', v)}
                  placeholder="Other agency (if any)"
                />
              </Field>
              <Field label="Onboarding / Comp Card Fee Status">
                <FInput
                  value={f.onboarding_fee_status}
                  onChange={(v) => p('onboarding_fee_status', v)}
                  placeholder="Pending / Paid / Waived"
                />
              </Field>
            </div>

            {/* MEDIA & UDFs */}
            <SectionHeader title="Media & Physical Specs" />
            <div style={grid}>
              <Field label="Height">
                <FInput value={f.height} onChange={(v) => p('height', v)} placeholder="5'10&quot;" />
              </Field>
              <Field label="Eye Color">
                <FInput value={f.eye_color} onChange={(v) => p('eye_color', v)} placeholder="Brown" />
              </Field>
              <Field label="Bust">
                <FInput value={f.bust} onChange={(v) => p('bust', v)} placeholder="34" />
              </Field>
              <Field label="Waist">
                <FInput value={f.waist} onChange={(v) => p('waist', v)} placeholder="26" />
              </Field>
              <Field label="Hips">
                <FInput value={f.hips} onChange={(v) => p('hips', v)} placeholder="36" />
              </Field>
              <Field label="Shoe Size">
                <FInput value={f.shoe_size} onChange={(v) => p('shoe_size', v)} placeholder="9" />
              </Field>
              <Field label="Scout Notes & Audition Feedback" full>
                <FTextarea
                  value={f.scout_notes}
                  onChange={(v) => p('scout_notes', v)}
                  rows={3}
                  placeholder="Internal notes on performance, personality, and potential…"
                />
              </Field>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.t2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Upload Digitals / Headshots / Video Reels
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {MEDIA_UPLOAD_TYPES.map((doc) => (
                  <div key={doc.id}>
                    <Lbl>{doc.label}</Lbl>
                    <FileUpload
                      fieldId={doc.id}
                      value={media[doc.id]?.data}
                      valueName={media[doc.id]?.name}
                      valueType={media[doc.id]?.type}
                      onChange={(id, data, name, type) => saveMedia(id, data, name, type)}
                      label={doc.label}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>

            {entryType === 'manual' && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.t2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}
                >
                  Compliance Documents (optional)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {REQUIRED_DOCS.map((doc) => (
                    <div key={doc.id}>
                      <Lbl>{doc.label}</Lbl>
                      <FileUpload
                        fieldId={doc.id}
                        value={docs[doc.id]?.data}
                        valueName={docs[doc.id]?.name}
                        valueType={docs[doc.id]?.type}
                        onChange={(id, data, name, type) => saveDoc(id, data, name, type)}
                        label={doc.label}
                        note={doc.note}
                        compact
                      />
                      {doc.id === 'proof_income' && (
                        <div style={{ fontSize: 10, color: T.amber, marginTop: 3 }}>
                          ℹ Self-support only — not used in approvals
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entryType === 'send_app' && (
              <div
                style={{
                  background: T.purpleL,
                  border: `1px solid ${T.purple}33`,
                  borderRadius: 6,
                  padding: '8px 12px',
                  marginBottom: 12,
                  fontSize: 12,
                  color: T.purple,
                }}
              >
                📧 Creates a holding record and emails the prospect a link to complete their
                application with document uploads.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              {entryType === 'manual' ? (
                <Btn variant="purple" onClick={save}>
                  Create Talent Applicant
                </Btn>
              ) : (
                <Btn variant="purple" onClick={saveAndSend}>
                  Create & Send →
                </Btn>
              )}
              <Btn onClick={onCancel}>Cancel</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { NewEntry }
