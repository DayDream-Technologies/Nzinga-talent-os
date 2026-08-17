/**
 * Seed NZG test applicants + pipeline talents into Supabase.
 * Usage: node scripts/seed-test-applicants.mjs
 * Requires linked project (reads keys via `supabase projects api-keys`).
 */
import { execSync } from 'node:child_process'

const PROJECT_REF = 'rvuchforbheotenhkxnm'
const URL = `https://${PROJECT_REF}.supabase.co`

function getServiceRoleKey() {
  const raw = execSync(`npx supabase projects api-keys --project-ref ${PROJECT_REF}`, {
    encoding: 'utf8',
  })
  const parsed = JSON.parse(raw)
  const key = parsed.keys?.find((k) => k.name === 'service_role')?.api_key
  if (!key) throw new Error('Could not resolve service_role key')
  return key
}

async function rest(path, { method = 'GET', body, key } = {}) {
  const prefer =
    method === 'GET'
      ? 'return=representation'
      : 'resolution=merge-duplicates,return=minimal'
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} failed (${res.status}): ${text}`)
  }
  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

const DOC = 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoK'
const DOC_META = { name: 'placeholder.pdf', type: 'application/pdf' }
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k='

const ALL_SECTIONS = [
  'personal',
  'interests',
  'general',
  'modeling',
  'acting',
  'sports',
  'influencing',
  'conflicts',
  'availability',
  'social',
  'id_verification',
  'final',
]

function mapNichesToInterests(nichesCsv) {
  return nichesCsv
    .split(',')
    .map((s) => s.trim())
    .map((n) =>
      n === 'Model'
        ? 'Modeling'
        : n === 'Actor'
          ? 'Acting'
          : n === 'Athlete'
            ? 'Sports & Athletics'
            : n === 'Influencer'
              ? 'Influencing / Content Creation'
              : n,
    )
    .filter(Boolean)
}

function padChars(text, min = 200, max = 500) {
  let out = String(text || '').trim()
  const filler =
    ' I am building a professional career and want clear representation support for bookings, brand work, and long-term growth with Nzinga.'
  while (out.length < min) out += filler
  return out.slice(0, max)
}

function completeAppData(p) {
  const interests = mapNichesToInterests(p.niches)
  const interestCsv = interests.join(',') || 'Influencing / Content Creation'
  const data = {
    legal_first: p.first,
    legal_last: p.last,
    preferred_name: `${p.first} ${p.last}`,
    dob: p.dob,
    phone: p.phone,
    email: p.email,
    city: p.city,
    state: p.state,
    country: 'USA',
    current_market: `${p.city}, ${p.state}`,
    doc_profile_photo: PHOTO,
    doc_profile_photo_name: 'profile.jpg',
    doc_profile_photo_type: 'image/jpeg',
    representation_interests: interestCsv,
    experience_level: 'Experienced',
    about_yourself: padChars(p.bio),
    career_goals: padChars(p.goals90),
    proud_accomplishments: padChars(p.achievements),
    why_nzinga_interest: padChars('I want professional representation with Nzinga and a team that can open doors.'),
    currently_represented: 'No',
    has_conflicting_obligations: 'No',
    work_markets: 'Local,National',
    willing_to_travel: 'Yes',
    currently_available: 'Yes',
    link_instagram: `https://instagram.com/${String(p.handle || '').replace('@', '')}`,
    doc_gov_id: DOC,
    doc_gov_id_name: 'Government_ID.pdf',
    doc_gov_id_type: DOC_META.type,
    why_represent: 'I believe Nzinga is the right partner for my career.',
    goals_1_2_years: p.goals1y || p.goals90,
    consent_truth: 'yes',
    consent_contact: 'yes',
    signature: `${p.first} ${p.last}`,
    signature_date: '2026-07-18',
  }

  if (interests.includes('Influencing / Content Creation') || interests.length === 0) {
    Object.assign(data, {
      influencer_primary_platform: p.platform,
      influencer_handle: p.handle,
      influencer_content_categories: 'Lifestyle,Fashion',
      influencer_followers: p.followers,
      influencer_content_desc: p.bio,
      influencer_brand_experience: p.brands || '',
    })
  }
  if (interests.includes('Modeling')) {
    Object.assign(data, {
      model_height: "5'9\"",
      model_clothing_size: '4',
      model_shoe_size: '8',
      model_hair_color: 'Brown',
      model_eye_color: 'Brown',
      model_experience: p.achievements,
      model_categories: 'Commercial,Editorial',
      doc_model_headshot: PHOTO,
      doc_model_headshot_name: 'headshot.jpg',
      doc_model_headshot_type: 'image/jpeg',
      doc_model_fullbody: PHOTO,
      doc_model_fullbody_name: 'fullbody.jpg',
      doc_model_fullbody_type: 'image/jpeg',
    })
  }
  if (interests.includes('Acting')) {
    Object.assign(data, {
      acting_experience_level: 'Experienced',
      acting_categories: 'Commercial,Film',
      acting_training: '',
      acting_credits: p.brands || '',
      doc_acting_headshot: PHOTO,
      doc_acting_headshot_name: 'acting_headshot.jpg',
      doc_acting_headshot_type: 'image/jpeg',
    })
  }
  if (interests.includes('Sports & Athletics')) {
    Object.assign(data, {
      sport_primary: 'Basketball',
      sport_position: 'Guard',
      sport_level: 'Collegiate',
      sport_years: '8',
      sport_highlights: p.achievements,
      doc_sport_photo: PHOTO,
      doc_sport_photo_name: 'athletic.jpg',
      doc_sport_photo_type: 'image/jpeg',
    })
  }

  return data
}

function sectionsForProfile(p) {
  const interests = mapNichesToInterests(p.niches)
  const sections = ['personal', 'interests', 'general', 'conflicts', 'availability', 'social', 'id_verification', 'final']
  if (interests.includes('Modeling')) sections.splice(3, 0, 'modeling')
  if (interests.includes('Acting')) sections.splice(3, 0, 'acting')
  if (interests.includes('Sports & Athletics')) sections.splice(3, 0, 'sports')
  if (interests.includes('Influencing / Content Creation') || interests.length === 0) sections.splice(3, 0, 'influencing')
  return [...new Set(sections)]
}

function baseTalent(overrides) {
  return {
    niches: [],
    scout_id: 'u1',
    created_by: 'u1',
    phone: '',
    email: '',
    social_handle: '',
    follower_count: '',
    er_pct: '',
    platform: '',
    location: '',
    pillar_scores: [0, 0, 0, 0, 0],
    pillar_rationales: ['', '', '', '', ''],
    jordan_score: 0,
    revenue_path: '',
    scout_summary: '',
    team1_notes: '',
    team1_decision: null,
    compliance: {},
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
    last_contacted: '2026-08-01',
    application_id: null,
    application_status: null,
    uploaded_docs: {},
    audit_log: [],
    ...overrides,
  }
}

// ── Pipeline talents (no application / past intake) ─────────────────────────
const pipelineTalents = [
  baseTalent({
    id: 't1',
    name: 'Zara Williams',
    stage: 'signed_onboarding',
    niches: ['Model', 'Influencer'],
    created_at: '2026-04-10T09:00:00Z',
    phone: '404-555-0142',
    email: 'zara.williams@example.com',
    social_handle: '@zarawilliams',
    follower_count: '2.1M',
    er_pct: '8.2',
    platform: 'Instagram / TikTok',
    location: 'Atlanta, GA',
    pillar_scores: [4, 5, 4, 4, 5],
    pillar_rationales: [
      'Exceptional brand consistency.',
      'Viral ER above 8%.',
      'Zero controversy.',
      'Diverse content.',
      '3 active brand deals.',
    ],
    jordan_score: 4.4,
    revenue_path: 'Sponsored posts ($8k/mo). 90-day: $25k luxury fashion.',
    scout_summary: 'Top-tier digital creator with proven commercial appeal.',
    team1_decision: 'approved',
    compliance: {
      legal_name: true,
      gov_id: true,
      dob: true,
      address: true,
      email_phone: true,
      tax_doc: true,
      banking: true,
      social_ownership: true,
    },
    rep_type: 'Exclusive',
    commission: '15',
    term_length: '12 months',
    team2_decision: 'approved',
    director_decision: 'approved',
    portal_setup: true,
    technical_routing: true,
    warm_handoff: 'Keisha Morris – Influencer Division',
    warm_handoff_confirmed: true,
    revenue_ytd: '47200',
    revenue_projected: '180000',
    last_contacted: '2026-05-18',
    audit_log: [
      { user: 'Jordan Hayes', role: 'Scout', action: 'Created holding record', stage: 'holding_entry', ts: '2026-04-10T09:00:00Z' },
      { user: 'Simone Nzinga', role: 'Director', action: 'Approved – Sign Client', stage: 'executive_review', ts: '2026-04-15T09:55:00Z' },
      { user: 'Alexis Grant', role: 'Success Manager', action: 'Warm hand-off confirmed', stage: 'signed_onboarding', ts: '2026-04-16T13:30:00Z' },
    ],
  }),
  baseTalent({
    id: 't2',
    name: 'Darius Cole',
    stage: 'team1_review',
    niches: ['Actor', 'Model'],
    created_at: '2026-05-01T11:00:00Z',
    phone: '310-555-0188',
    email: 'darius.cole@example.com',
    social_handle: '@dariuscole',
    follower_count: '890K',
    er_pct: '3.1',
    platform: 'Instagram / YouTube',
    location: 'Los Angeles, CA',
    pillar_scores: [4, 3, 4, 4, 4],
    pillar_rationales: ['SAG eligible.', 'ER slightly low.', 'Clean image.', 'Indie drama niche.', 'Two commercials.'],
    jordan_score: 3.8,
    revenue_path: 'Commercials $3k/mo. 90-day: 2 bookings.',
    scout_summary: 'Disciplined actor, pillar 2 borderline.',
    revenue_projected: '36000',
    last_contacted: '2026-05-02',
    audit_log: [
      { user: 'Jordan Hayes', role: 'Scout', action: 'Created holding record', stage: 'holding_entry', ts: '2026-05-01T11:00:00Z' },
      { user: 'Jordan Hayes', role: 'Scout', action: 'Completed Talent Packet → Scout Complete', stage: 'scout_complete', ts: '2026-05-02T15:10:00Z' },
    ],
  }),
  baseTalent({
    id: 't3',
    name: 'Mia Torres',
    stage: 'ops_processing',
    niches: ['Athlete', 'Influencer'],
    created_at: '2026-04-20T08:30:00Z',
    phone: '713-555-0167',
    email: 'mia.torres@example.com',
    social_handle: '@miatorres_fit',
    follower_count: '1.4M',
    er_pct: '6.8',
    platform: 'Instagram / YouTube',
    location: 'Houston, TX',
    pillar_scores: [5, 4, 4, 4, 4],
    pillar_rationales: ['D1 athlete 3 titles.', 'High engagement.', 'Zero risk.', 'Consistent posting.', 'NIL $12k YTD.'],
    jordan_score: 4.2,
    revenue_path: 'NIL deals. 90-day: Adidas NIL activation.',
    scout_summary: 'Elite D1 athlete with exceptional NIL positioning.',
    team1_decision: 'approved',
    compliance: {
      legal_name: true,
      gov_id: true,
      dob: true,
      address: true,
      email_phone: true,
      tax_doc: false,
      banking: false,
      social_ownership: true,
    },
    rep_type: 'Exclusive',
    commission: '20',
    term_length: '24 months',
    revenue_ytd: '12000',
    revenue_projected: '95000',
    last_contacted: '2026-05-18',
  }),
  baseTalent({
    id: 't5',
    name: 'Renee Park',
    stage: 'executive_review',
    niches: ['Actor', 'Influencer'],
    created_at: '2026-04-05T07:20:00Z',
    phone: '212-555-0194',
    email: 'renee.park@example.com',
    social_handle: '@reneepark',
    follower_count: '3.8M',
    er_pct: '12.0',
    platform: 'Instagram / YouTube / TikTok',
    location: 'New York, NY',
    pillar_scores: [5, 5, 5, 4, 5],
    pillar_rationales: ['Series regular.', 'ER 12%.', 'Spotless record.', 'Cross-platform.', '$40k/mo brand.'],
    jordan_score: 4.8,
    revenue_path: 'Series fees + brand integrations. 90-day: $150k.',
    scout_summary: 'Strongest pipeline candidate this quarter.',
    team1_decision: 'approved',
    compliance: {
      legal_name: true,
      gov_id: true,
      dob: true,
      address: true,
      email_phone: true,
      tax_doc: true,
      banking: true,
      social_ownership: true,
    },
    rep_type: 'Exclusive',
    commission: '15',
    term_length: '18 months',
    team2_decision: 'approved',
    revenue_ytd: '120000',
    revenue_projected: '480000',
    last_contacted: '2026-05-15',
  }),
  baseTalent({
    id: 't6',
    name: 'Andre Simmons',
    stage: 'scout_complete',
    niches: ['Influencer', 'Model'],
    created_at: '2026-07-12T14:00:00Z',
    phone: '305-555-0133',
    email: 'andre.simmons@example.com',
    social_handle: '@andresimmons',
    follower_count: '640K',
    er_pct: '5.4',
    platform: 'TikTok / Instagram',
    location: 'Miami, FL',
    pillar_scores: [4, 4, 4, 3, 4],
    pillar_rationales: [
      'Strong lifestyle brand fit.',
      'Solid mid-funnel ER.',
      'No brand-safety flags.',
      'Fashion + travel mix.',
      'Two active affiliate deals.',
    ],
    jordan_score: 3.8,
    revenue_path: 'Affiliate + sponsored Reels. 90-day: beauty launch.',
    scout_summary: 'Ready for Team 1 — clean packet, consistent posting cadence.',
    revenue_projected: '42000',
    last_contacted: '2026-07-28',
    audit_log: [
      { user: 'Jordan Hayes', role: 'Scout', action: 'Created holding record', stage: 'holding_entry', ts: '2026-07-12T14:00:00Z' },
      { user: 'Jordan Hayes', role: 'Scout', action: 'Completed Talent Packet → Scout Complete', stage: 'scout_complete', ts: '2026-07-20T11:15:00Z' },
    ],
  }),
  baseTalent({
    id: 't7',
    name: 'Kenji Nakamura',
    stage: 'team2_audit',
    niches: ['Actor', 'Influencer'],
    created_at: '2026-06-02T10:00:00Z',
    phone: '206-555-0171',
    email: 'kenji.nakamura@example.com',
    social_handle: '@kenjinakamura',
    follower_count: '1.1M',
    er_pct: '7.1',
    platform: 'YouTube / Instagram',
    location: 'Seattle, WA',
    pillar_scores: [5, 4, 5, 4, 4],
    pillar_rationales: [
      'Cross-over comedy/acting lane.',
      'High watch-time.',
      'Clean public record.',
      'Strong short-form + long-form.',
      'Prior network digital series.',
    ],
    jordan_score: 4.4,
    revenue_path: 'YouTube AdSense + brand integrations. 90-day: streaming pilot.',
    scout_summary: 'High-upside creator with entertainment crossover potential.',
    team1_decision: 'approved',
    compliance: {
      legal_name: true,
      gov_id: true,
      dob: true,
      address: true,
      email_phone: true,
      tax_doc: true,
      banking: true,
      social_ownership: true,
    },
    rep_type: 'Exclusive',
    commission: '15',
    term_length: '12 months',
    revenue_ytd: '38000',
    revenue_projected: '140000',
    last_contacted: '2026-07-30',
    audit_log: [
      { user: 'Priya Okafor', role: 'Ops Specialist', action: 'Compliance verified → Team 2 Audit', stage: 'ops_processing', ts: '2026-07-22T16:40:00Z' },
    ],
  }),
]

// ── Applicants (applications + linked talents) ──────────────────────────────
const applicants = [
  {
    // sent — invite only
    talent: baseTalent({
      id: 't8',
      name: 'Aaliyah Brooks',
      stage: 'holding_entry',
      created_at: '2026-08-01T09:00:00Z',
      phone: '404-555-0221',
      email: 'aaliyah.brooks@example.com',
      location: 'Atlanta, GA',
      application_id: 'app_aaliyah',
      application_status: 'sent',
      audit_log: [
        { user: 'Jordan Hayes', role: 'Scout', action: 'Created holding record', stage: 'holding_entry', ts: '2026-08-01T09:00:00Z' },
        { user: 'Jordan Hayes', role: 'Scout', action: 'Sent application invite', stage: 'holding_entry', ts: '2026-08-01T09:05:00Z' },
      ],
    }),
    app: {
      id: 'app_aaliyah',
      talent_id: 't8',
      access_code: 'AALI2026',
      company_code: 'NZG',
      talent_name: 'Aaliyah Brooks',
      talent_email: 'aaliyah.brooks@example.com',
      status: 'sent',
      created_at: '2026-08-01T09:05:00Z',
      last_saved: '2026-08-01T09:05:00Z',
      completed_sections: [],
      data: {},
    },
  },
  {
    // in_progress — personal + social only
    talent: baseTalent({
      id: 't9',
      name: 'Marcus Nguyen',
      stage: 'holding_entry',
      created_at: '2026-07-28T15:20:00Z',
      phone: '714-555-0288',
      email: 'marcus.nguyen@example.com',
      social_handle: '@marcusnguyen',
      follower_count: '210K',
      er_pct: '3.8',
      platform: 'TikTok',
      location: 'Orange County, CA',
      application_id: 'app_marcus_n',
      application_status: 'in_progress',
      audit_log: [
        { user: 'Jordan Hayes', role: 'Scout', action: 'Created holding record', stage: 'holding_entry', ts: '2026-07-28T15:20:00Z' },
      ],
    }),
    app: {
      id: 'app_marcus_n',
      talent_id: 't9',
      access_code: 'MARC2026',
      company_code: 'NZG',
      talent_name: 'Marcus Nguyen',
      talent_email: 'marcus.nguyen@example.com',
      status: 'in_progress',
      created_at: '2026-07-28T15:25:00Z',
      last_saved: '2026-08-03T18:10:00Z',
      completed_sections: ['personal', 'interests'],
      data: {
        legal_first: 'Marcus',
        legal_last: 'Nguyen',
        preferred_name: 'Marcus Nguyen',
        dob: '1998-11-02',
        phone: '714-555-0288',
        email: 'marcus.nguyen@example.com',
        city: 'Costa Mesa',
        state: 'CA',
        country: 'USA',
        current_market: 'Costa Mesa, CA',
        doc_profile_photo: PHOTO,
        doc_profile_photo_name: 'profile.jpg',
        doc_profile_photo_type: 'image/jpeg',
        representation_interests: 'Influencing / Content Creation',
        influencer_handle: '@marcusnguyen',
        influencer_primary_platform: 'TikTok',
        influencer_followers: '210K',
      },
    },
  },
  {
    // submitted incomplete — missing final + id
    talent: baseTalent({
      id: 't10',
      name: 'Sofia Ramirez',
      stage: 'holding_entry',
      niches: ['Modeling', 'Influencing / Content Creation'],
      created_at: '2026-07-20T11:00:00Z',
      phone: '312-555-0344',
      email: 'sofia.ramirez@example.com',
      social_handle: '@sofiaramirez',
      follower_count: '780K',
      er_pct: '6.2',
      platform: 'Instagram',
      location: 'Chicago, IL',
      application_id: 'app_sofia',
      application_status: 'submitted',
      applicant_stage_status: 'Under Review',
      scout_summary: 'Fashion/lifestyle creator — application incomplete (signature outstanding).',
      audit_log: [
        { user: 'Sofia Ramirez', role: 'Prospect', action: 'Submitted application (incomplete)', stage: 'holding_entry', ts: '2026-07-25T20:00:00Z' },
      ],
    }),
    app: {
      id: 'app_sofia',
      talent_id: 't10',
      access_code: 'SOFI2026',
      company_code: 'NZG',
      talent_name: 'Sofia Ramirez',
      talent_email: 'sofia.ramirez@example.com',
      status: 'submitted',
      created_at: '2026-07-20T11:05:00Z',
      last_saved: '2026-07-25T20:00:00Z',
      completed_sections: ['personal', 'interests', 'general', 'modeling', 'influencing', 'conflicts', 'availability', 'social'],
      data: {
        legal_first: 'Sofia',
        legal_last: 'Ramirez',
        preferred_name: 'Sofia Ramirez',
        dob: '1997-06-18',
        phone: '312-555-0344',
        email: 'sofia.ramirez@example.com',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        current_market: 'Chicago, IL',
        doc_profile_photo: PHOTO,
        doc_profile_photo_name: 'profile.jpg',
        doc_profile_photo_type: 'image/jpeg',
        representation_interests: 'Modeling,Influencing / Content Creation',
        experience_level: 'Experienced',
        about_yourself: 'Chicago-based fashion and lifestyle creator focused on accessible luxury and Latine culture.',
        career_goals: 'Land two mid-tier fashion partnerships and grow IG Reels by 20%.',
        proud_accomplishments: 'Featured in Vogue Mexico digital, 4 paid brand campaigns in 2025.',
        why_nzinga_interest: 'I want professional representation with Nzinga.',
        model_height: "5'8\"",
        model_clothing_size: '6',
        model_shoe_size: '8.5',
        model_hair_color: 'Dark brown',
        model_eye_color: 'Hazel',
        model_experience: 'Editorial and commercial work since 2022.',
        model_categories: 'Commercial,Editorial',
        doc_model_headshot: PHOTO,
        doc_model_headshot_name: 'headshot.jpg',
        doc_model_headshot_type: 'image/jpeg',
        doc_model_fullbody: PHOTO,
        doc_model_fullbody_name: 'fullbody.jpg',
        doc_model_fullbody_type: 'image/jpeg',
        influencer_handle: '@sofiaramirez',
        influencer_primary_platform: 'Instagram',
        influencer_followers: '780K',
        influencer_content_categories: 'Fashion,Lifestyle',
        influencer_content_desc: 'Fashion and lifestyle content.',
        currently_represented: 'No',
        has_conflicting_obligations: 'No',
        work_markets: 'Local,Regional,National',
        willing_to_travel: 'Yes',
        currently_available: 'Yes',
        link_instagram: 'https://instagram.com/sofiaramirez',
        // intentionally missing id_verification + final signature
      },
    },
  },
  {
    // minor — pending guardian verification
    talent: baseTalent({
      id: 't16',
      name: 'Jordan Lee',
      stage: 'holding_entry',
      niches: ['Acting'],
      created_at: '2026-08-10T12:00:00Z',
      phone: '646-555-0911',
      email: 'jordan.lee.minor@example.com',
      location: 'New York, NY',
      application_id: 'app_jordan_lee',
      application_status: 'pending_guardian',
      applicant_stage_status: 'New / Lead',
      audit_log: [
        { user: 'Jordan Lee', role: 'Prospect', action: 'Submitted for guardian verification', stage: 'holding_entry', ts: '2026-08-10T14:20:00Z' },
      ],
    }),
    app: {
      id: 'app_jordan_lee',
      talent_id: 't16',
      access_code: 'JLEE2026',
      company_code: 'NZG',
      talent_name: 'Jordan Lee',
      talent_email: 'jordan.lee.minor@example.com',
      status: 'pending_guardian',
      guardian_status: 'pending',
      guardian_email: 'parent.lee@example.com',
      created_at: '2026-08-10T12:05:00Z',
      last_saved: '2026-08-10T14:20:00Z',
      completed_sections: ['personal', 'interests', 'general', 'acting', 'conflicts', 'availability', 'social', 'id_verification', 'final'],
      data: {
        legal_first: 'Jordan',
        legal_last: 'Lee',
        preferred_name: 'Jordan Lee',
        dob: '2012-05-04',
        phone: '646-555-0911',
        email: 'jordan.lee.minor@example.com',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        current_market: 'New York, NY',
        guardian_invite_email: 'parent.lee@example.com',
        doc_profile_photo: PHOTO,
        doc_profile_photo_name: 'profile.jpg',
        doc_profile_photo_type: 'image/jpeg',
        representation_interests: 'Acting',
        experience_level: 'Beginner',
        about_yourself: padChars('Middle-school actor interested in commercials and youth theater.'),
        career_goals: padChars('Book commercial work with parent support and keep training consistently.'),
        proud_accomplishments: padChars('School play lead; local commercial callback; youth workshop showcase.'),
        why_nzinga_interest: padChars('My family wants professional guidance for a safe and structured path.'),
        acting_experience_level: 'Beginner',
        acting_categories: 'Commercial,Theater',
        acting_training: '',
        doc_acting_headshot: PHOTO,
        doc_acting_headshot_name: 'headshot.jpg',
        doc_acting_headshot_type: 'image/jpeg',
        currently_represented: 'No',
        has_conflicting_obligations: 'No',
        work_markets: 'Local,Regional',
        willing_to_travel: 'Yes',
        currently_available: 'Yes',
        link_instagram: 'https://instagram.com/jordanleeminor',
        id_note_minor: true,
        why_represent: 'I want to grow as a young actor with Nzinga.',
        goals_1_2_years: 'Book two commercials and continue training.',
        consent_truth: 'yes',
        consent_contact: 'yes',
        signature: 'Jordan Lee',
        signature_date: '2026-08-10',
      },
    },
  },
]

const completeProfiles = [
  {
    id: 't11',
    appId: 'app_jamal',
    code: 'JAMA2026',
    first: 'Jamal',
    last: 'Washington',
    dob: '1995-04-12',
    phone: '202-555-0411',
    email: 'jamal.washington@example.com',
    address: '1200 U St NW',
    city: 'Washington',
    state: 'DC',
    zip: '20009',
    handle: '@jamalwash',
    platform: 'YouTube',
    followers: '920K',
    er: '5.9',
    niches: 'Athlete,Influencer',
    bio: 'Former D1 basketball player turned sports commentary and training content creator.',
    achievements: '1.2M YouTube views on training series; Nike community event host 2025.',
    brands: 'Nike Community, Gatorade local, Under Armour affiliate',
    goals90: 'Secure a national training-series partnership and grow newsletter to 25k.',
    goals1y: 'Launch a signature training app with brand backing.',
    location: 'Washington, DC',
    created: '2026-07-10T13:00:00Z',
    submitted: '2026-07-18T16:40:00Z',
  },
  {
    id: 't12',
    appId: 'app_elena',
    code: 'ELEN2026',
    first: 'Elena',
    last: 'Vasquez',
    dob: '1999-09-03',
    phone: '213-555-0522',
    email: 'elena.vasquez@example.com',
    address: '840 S Spring St',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90014',
    handle: '@elenavasquez',
    platform: 'Instagram',
    followers: '1.6M',
    er: '9.1',
    niches: 'Model,Influencer',
    bio: 'LA-based model and beauty creator known for clean glam tutorials and bilingual content.',
    achievements: 'Sephora squad finalist; 3 national beauty campaigns.',
    brands: 'Sephora, Fenty Beauty, Rare Beauty',
    goals90: 'Book a national beauty campaign and expand TikTok to 500K.',
    goals1y: 'Build a bilingual beauty brand incubator with Nzinga.',
    location: 'Los Angeles, CA',
    created: '2026-07-05T10:30:00Z',
    submitted: '2026-07-12T19:15:00Z',
  },
  {
    id: 't13',
    appId: 'app_tyler',
    code: 'TYLE2026',
    first: 'Tyler',
    last: 'Brooks',
    dob: '1996-01-27',
    phone: '512-555-0633',
    email: 'tyler.brooks@example.com',
    address: '901 Congress Ave',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    handle: '@tylerbrooks',
    platform: 'TikTok',
    followers: '540K',
    er: '7.4',
    niches: 'Influencer,Actor',
    bio: 'Austin comedy creator with short-form sketches and commercial-acting credits.',
    achievements: 'SAG-AFTRA eligible; 3 national commercial bookings.',
    brands: 'Indeed, DoorDash, local tourism board',
    goals90: 'Land two national commercial auditions through Nzinga.',
    goals1y: 'Transition into series regular comedy roles.',
    location: 'Austin, TX',
    created: '2026-07-15T09:00:00Z',
    submitted: '2026-07-22T14:05:00Z',
  },
  {
    id: 't14',
    appId: 'app_naomi',
    code: 'NAOM2026',
    first: 'Naomi',
    last: 'Okonkwo',
    dob: '1994-12-08',
    phone: '347-555-0744',
    email: 'naomi.okonkwo@example.com',
    address: '210 Bedford Ave',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11249',
    handle: '@naomiokonkwo',
    platform: 'Instagram',
    followers: '1.05M',
    er: '8.0',
    niches: 'Model,Actor',
    bio: 'Brooklyn-based model and emerging actor with runway and editorial experience.',
    achievements: 'NYFW runway 2024–25; guest role on streaming drama.',
    brands: 'Reformation, Madewell, MAC Cosmetics',
    goals90: 'Secure exclusive representation and book fall campaign work.',
    goals1y: 'Build a dual modeling/acting slate with premium brands.',
    location: 'Brooklyn, NY',
    created: '2026-06-28T12:00:00Z',
    submitted: '2026-07-08T11:50:00Z',
  },
  {
    id: 't15',
    appId: 'app_chris',
    code: 'CHRI2026',
    first: 'Chris',
    last: 'Patel',
    dob: '1993-07-21',
    phone: '408-555-0855',
    email: 'chris.patel@example.com',
    address: '333 W San Carlos St',
    city: 'San Jose',
    state: 'CA',
    zip: '95110',
    handle: '@chrispateltech',
    platform: 'YouTube',
    followers: '1.3M',
    er: '4.2',
    niches: 'Influencer',
    bio: 'Tech and consumer-electronics reviewer with deep product analysis and live unboxings.',
    achievements: 'CES creator floor 2025; partnered with two Tier-1 OEMs.',
    brands: 'Samsung, Anker, Logitech',
    goals90: 'Negotiate exclusive consumer-tech representation with Nzinga.',
    goals1y: 'Launch a paid membership community and brand studio.',
    location: 'San Jose, CA',
    created: '2026-07-01T16:00:00Z',
    submitted: '2026-07-09T21:30:00Z',
  },
]

for (const p of completeProfiles) {
  const data = completeAppData(p)
  const niches = mapNichesToInterests(p.niches)
  applicants.push({
    talent: baseTalent({
      id: p.id,
      name: `${p.first} ${p.last}`,
      stage: 'holding_entry',
      niches,
      created_at: p.created,
      phone: p.phone,
      email: p.email,
      social_handle: p.handle,
      follower_count: p.followers,
      er_pct: p.er,
      platform: p.platform,
      location: p.location,
      revenue_path: p.goals90,
      scout_summary: p.bio,
      application_id: p.appId,
      application_status: 'submitted',
      applicant_stage_status: 'New / Lead',
      compliance: {
        legal_name: true,
        gov_id: true,
        dob: true,
        address: true,
        email_phone: true,
        tax_doc: true,
        banking: true,
        social_ownership: true,
      },
      uploaded_docs: {
        gov_id: { name: 'Government_ID.pdf', data: DOC, type: DOC_META.type },
        profile_photo: { name: 'profile.jpg', data: PHOTO, type: 'image/jpeg' },
      },
      audit_log: [
        {
          user: `${p.first} ${p.last}`,
          role: 'Prospect',
          action: 'Submitted application — auto-created holding record',
          stage: 'holding_entry',
          ts: p.submitted,
        },
      ],
    }),
    app: {
      id: p.appId,
      talent_id: p.id,
      access_code: p.code,
      company_code: 'NZG',
      talent_name: `${p.first} ${p.last}`,
      talent_email: p.email,
      status: 'submitted',
      created_at: p.created,
      last_saved: p.submitted,
      completed_sections: sectionsForProfile(p),
      data,
    },
  })
}

// Also keep Kai from local seed for continuity
applicants.push({
  talent: baseTalent({
    id: 't4',
    name: 'Kai Johnson',
    stage: 'holding_entry',
    niches: ['Influencing / Content Creation'],
    created_at: '2026-05-18T10:00:00Z',
    phone: '312-555-0199',
    email: 'kai@example.com',
    social_handle: '@kaij_music',
    follower_count: '320K',
    er_pct: '2.1',
    platform: 'TikTok / Instagram',
    location: 'Chicago, IL',
    application_id: 'app_kai',
    application_status: 'in_progress',
    applicant_stage_status: 'Qualification in Progress',
    last_contacted: '2026-05-18',
    audit_log: [
      { user: 'Jordan Hayes', role: 'Scout', action: 'Created holding record', stage: 'holding_entry', ts: '2026-05-18T10:00:00Z' },
    ],
  }),
  app: {
    id: 'app_kai',
    talent_id: 't4',
    access_code: 'KAI2026',
    company_code: 'NZG',
    talent_name: 'Kai Johnson',
    talent_email: 'kai@example.com',
    status: 'in_progress',
    created_at: '2026-05-18T10:00:00Z',
    last_saved: '2026-05-19T14:30:00Z',
    completed_sections: ['personal', 'interests'],
    data: {
      legal_first: 'Kai',
      legal_last: 'Johnson',
      preferred_name: 'Kai Johnson',
      dob: '2000-03-15',
      phone: '312-555-0199',
      email: 'kai@example.com',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      current_market: 'Chicago, IL',
      doc_profile_photo: PHOTO,
      doc_profile_photo_name: 'profile.jpg',
      doc_profile_photo_type: 'image/jpeg',
      representation_interests: 'Influencing / Content Creation',
      influencer_handle: '@kaij_music',
      influencer_primary_platform: 'TikTok',
      influencer_followers: '320K',
    },
  },
})

async function main() {
  const key = getServiceRoleKey()

  // Columns that exist on remote tables (extra UI-only fields must not be posted)
  const TALENT_COLS = new Set([
    'id', 'account_number', 'name', 'stage', 'niches', 'scout_id', 'created_by', 'created_at',
    'phone', 'email', 'social_handle', 'follower_count', 'er_pct', 'platform', 'location',
    'pillar_scores', 'pillar_rationales', 'jordan_score', 'revenue_path', 'scout_summary',
    'team1_notes', 'team1_decision', 'compliance', 'rep_type', 'commission', 'term_length',
    'team2_notes', 'team2_decision', 'director_decision', 'portal_setup', 'technical_routing',
    'warm_handoff', 'warm_handoff_confirmed', 'revenue_ytd', 'revenue_projected', 'last_contacted',
    'application_id', 'application_status', 'uploaded_docs', 'audit_log',
  ])
  const APP_COLS = new Set([
    'id', 'talent_id', 'access_code', 'company_code', 'talent_name', 'talent_email', 'status',
    'created_at', 'last_saved', 'completed_sections', 'data', 'guardian_status', 'guardian_email',
  ])

  function pick(obj, cols) {
    const row = {}
    for (const k of cols) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) row[k] = obj[k]
      else row[k] = null
    }
    return row
  }

  const existing = (await rest('talents?select=id,account_number', { key })) || []
  const byId = Object.fromEntries(existing.map((t) => [t.id, t.account_number]))
  const usedAccounts = new Set(existing.map((t) => t.account_number).filter(Boolean))

  function nextAccount(i) {
    let n = 200001 + i
    let code = `NZG-${String(n).padStart(6, '0')}`
    while (usedAccounts.has(code)) {
      n += 1
      code = `NZG-${String(n).padStart(6, '0')}`
    }
    usedAccounts.add(code)
    return code
  }

  const talentsRaw = [...pipelineTalents, ...applicants.map((a) => a.talent)].map((t, i) => ({
    ...t,
    account_number: byId[t.id] || t.account_number || nextAccount(i),
  }))
  const talents = talentsRaw.map((t) => pick(t, TALENT_COLS))
  const applications = applicants.map((a) => pick(a.app, APP_COLS))

  console.log(`Upserting ${talents.length} talents…`)
  await rest('talents?on_conflict=id', { method: 'POST', body: talents, key })

  console.log(`Upserting ${applications.length} applications…`)
  await rest('applications?on_conflict=id', { method: 'POST', body: applications, key })

  const talentRows = await rest('talents?select=id,name,stage', { key })
  const appRows = await rest(
    'applications?select=id,talent_name,status,company_code,access_code&company_code=eq.NZG&order=status',
    { key },
  )

  console.log('\nTalents by stage:')
  const byStage = {}
  for (const t of talentRows || []) {
    byStage[t.stage] = (byStage[t.stage] || 0) + 1
  }
  console.log(byStage)

  console.log('\nNZG applications:')
  for (const a of appRows || []) {
    console.log(`  ${String(a.status).padEnd(16)} ${String(a.access_code).padEnd(10)} ${a.talent_name}`)
  }
  console.log(`\nDone. ${talentRows?.length ?? 0} talents, ${appRows?.length ?? 0} NZG applications.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
