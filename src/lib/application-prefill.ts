import { getVisibleSections, isAppComplete, validateSection } from '@/constants/app-sections'
import { REPRESENTATION_INTERESTS } from '@/constants/applicant-fields'
import type { AgencyProspect } from '@/types/agency'
import type { Application, ApplicationData } from '@/types/application'
import type { Talent } from '@/types/talent'
import type { TalentUdf } from '@/types/udf'

/** Pipeline talent plus optional New Entry city/state fields. */
export type PrefillTalent = Partial<Talent> & {
  city?: string
  state?: string
  country?: string
}

function text(value: unknown): string {
  if (value === true) return 'Yes'
  if (value === false || value == null) return ''
  return String(value).trim()
}

function setIfEmpty(data: ApplicationData, key: string, value: unknown) {
  const next = text(value)
  if (!next) return
  const current = data[key]
  if (current === true) return
  if (text(current)) return
  data[key] = next
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return { first: parts[0] || '', last: parts.slice(1).join(' ') }
}

function parseLocation(location: string): { city: string; state: string; country: string } {
  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  return {
    city: parts[0] || '',
    state: parts[1] || '',
    country: parts[2] || '',
  }
}

/** Map CRM / roster labels onto application representation_interests options. */
export function representationInterestFromWorkArea(raw: string | undefined | null): string {
  const value = text(raw)
  if (!value) return ''
  const lower = value.toLowerCase()
  const exact = REPRESENTATION_INTERESTS.find((option) => option.toLowerCase() === lower)
  if (exact) return exact
  if (lower.includes('model')) return 'Modeling'
  if (lower.includes('act')) return 'Acting'
  if (lower.includes('sport') || lower.includes('athlet')) return 'Sports & Athletics'
  if (lower.includes('influenc') || lower.includes('content')) return 'Influencing / Content Creation'
  return ''
}

function joinInterests(...values: Array<string | string[] | undefined | null>): string {
  const labels: string[] = []
  for (const value of values) {
    const parts = Array.isArray(value) ? value : text(value).split(',')
    for (const part of parts) {
      const mapped = representationInterestFromWorkArea(part)
      if (mapped && !labels.includes(mapped)) labels.push(mapped)
    }
  }
  return labels.join(',')
}

export function completedSectionsFromData(data: ApplicationData): string[] {
  return getVisibleSections(data)
    .filter((section) => validateSection(section.id, data).length === 0)
    .map((section) => section.id)
}

/**
 * Copy already-known prospect / talent information into matching application fields.
 * Existing application answers win; empty fields are filled from CRM and roster data.
 */
export function prefillApplicationData(input: {
  talent?: PrefillTalent | null
  prospect?: AgencyProspect | null
  existing?: ApplicationData
}): ApplicationData {
  const talent = input.talent || {}
  const prospect = input.prospect
  const udf = (prospect?.udf || {}) as Partial<TalentUdf>
  const data: ApplicationData = { ...(talent.application_data || {}), ...(input.existing || {}) }

  const name = text(talent.name) || text(prospect?.name)
  const split = splitName(name)
  const first = text(talent.first_name) || text(prospect?.firstName) || split.first
  const last = text(talent.last_name) || text(prospect?.lastName) || split.last
  const fromLocation = parseLocation(text(talent.location))

  setIfEmpty(data, 'legal_first', first)
  setIfEmpty(data, 'legal_last', last)
  setIfEmpty(data, 'preferred_name', text(talent.stage_name) || text(udf.stageName) || name)
  setIfEmpty(data, 'email', text(talent.email) || text(prospect?.email))
  setIfEmpty(data, 'phone', text(talent.phone) || text(prospect?.phone))
  setIfEmpty(data, 'dob', text(talent.dob) || text(prospect?.dateOfBirth))
  setIfEmpty(data, 'city', text(talent.city) || text(prospect?.city) || fromLocation.city)
  setIfEmpty(data, 'state', text(talent.state) || text(prospect?.state) || fromLocation.state)
  setIfEmpty(data, 'country', text(talent.country) || fromLocation.country)
  setIfEmpty(
    data,
    'current_market',
    [text(talent.city) || text(prospect?.city) || fromLocation.city, text(talent.state) || text(prospect?.state) || fromLocation.state]
      .filter(Boolean)
      .join(', '),
  )
  setIfEmpty(data, 'website', text(talent.link_website) || text(udf.portfolioComp))
  setIfEmpty(
    data,
    'representation_interests',
    joinInterests(
      talent.niches,
      talent.roster_division,
      prospect?.workArea,
      udf.talentTypes,
    ),
  )
  setIfEmpty(data, 'guardian_invite_email', text(prospect?.parentEmail) || text(talent.parent_email) || text(udf.emergencyEmail))
  setIfEmpty(data, 'model_height', text(talent.height) || text(udf.height))
  setIfEmpty(data, 'model_shoe_size', text(talent.shoe_size) || text(udf.shoeSize))
  setIfEmpty(data, 'model_eye_color', text(talent.eye_color) || text(udf.eyeColor))
  setIfEmpty(data, 'model_bust', text(talent.bust) || text(udf.bust))
  setIfEmpty(data, 'model_waist', text(talent.waist) || text(udf.waist))
  setIfEmpty(data, 'model_hips', text(talent.hips) || text(udf.hips))
  setIfEmpty(data, 'model_weight', text(udf.weight))
  setIfEmpty(data, 'model_hair_color', text(udf.hairColor))
  setIfEmpty(data, 'model_categories', text(udf.modelingCategory))
  setIfEmpty(data, 'link_instagram', text(talent.link_instagram))
  setIfEmpty(data, 'link_tiktok', text(talent.link_tiktok))
  setIfEmpty(data, 'link_youtube', text(talent.link_youtube))
  setIfEmpty(data, 'link_website', text(talent.link_website))
  setIfEmpty(data, 'link_portfolio', text(talent.link_portfolio))
  setIfEmpty(data, 'link_other', text(talent.link_other))
  setIfEmpty(data, 'influencer_handle', text(talent.social_handle) || text(udf.socialHandles))
  setIfEmpty(data, 'influencer_primary_platform', text(talent.platform) || text(udf.primaryPlatform))
  setIfEmpty(data, 'influencer_followers', text(talent.follower_count) || text(udf.totalFollowers))
  setIfEmpty(data, 'career_goals', text(udf.careerGoals) || text(talent.revenue_path))
  setIfEmpty(data, 'willing_to_travel', text(udf.travelInternational))
  setIfEmpty(data, 'work_markets', text(udf.preferredLocations))
  setIfEmpty(data, 'currently_available', text(udf.availabilityStatus))
  setIfEmpty(data, 'acting_categories', text(udf.actingCategory))
  setIfEmpty(data, 'acting_training', text(udf.actingTraining))
  setIfEmpty(data, 'acting_credits', text(udf.actingExperience))
  setIfEmpty(data, 'sport_primary', text(udf.sport))
  setIfEmpty(data, 'sport_position', text(udf.position))
  setIfEmpty(data, 'sport_team', text(udf.team))
  setIfEmpty(data, 'sport_level', text(udf.league))

  return data
}

export function isApplicationReadyToImport(app: Application): boolean {
  if (app.status === 'pending_guardian' || app.guardian_status === 'pending') return false
  if (app.status !== 'submitted') return false
  return isAppComplete(app)
}

export function findLinkedTalent(talents: Talent[], app: Application): Talent | undefined {
  const byApp = talents.find((t) => t.application_id === app.id)
  if (byApp) return byApp
  if (app.talent_id) {
    const byId = talents.find((t) => t.id === app.talent_id)
    if (byId) return byId
  }
  const email = text(app.talent_email).toLowerCase()
  if (!email) return undefined
  const matches = talents.filter((t) => text(t.email).toLowerCase() === email)
  return matches.length === 1 ? matches[0] : undefined
}
