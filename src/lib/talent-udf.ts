import type { Application, ApplicationData } from '@/types/application'
import type { AgencyProspect } from '@/types/agency'
import type { TalentType, TalentUdf } from '@/types/udf'

const STRING_KEYS = [
  'stageName',
  'talentStatus',
  'representationType',
  'representationStart',
  'representationEnd',
  'assignedAgent',
  'assignedManager',
  'talentTier',
  'careerGoals',
  'preferredContact',
  'emergencyName',
  'emergencyRelationship',
  'emergencyPhone',
  'emergencyEmail',
  'contractType',
  'contractStatus',
  'contractStart',
  'contractEnd',
  'renewalDate',
  'commissionRate',
  'managementFee',
  'exclusivity',
  'exclusivityCategory',
  'contractNotes',
  'availabilityStatus',
  'unavailableStart',
  'unavailableEnd',
  'preferredLocations',
  'travelInternational',
  'minBookingRate',
  'preferredJobTypes',
  'bookingNotes',
  'paymentEntity',
  'businessName',
  'w9Status',
  'paymentMethod',
  'financialCommissionRate',
  'paymentTerms',
  'paymentNotes',
  'govIdType',
  'govIdExpiration',
  'passportExpiration',
  'workAuth',
  'workAuthExpiration',
  'unionGuild',
  'licenseCert',
  'licenseExpiration',
  'preferredBrandCategories',
  'restrictedBrandCategories',
  'currentPartnerships',
  'brandExclusivity',
  'usageRights',
  'campaignCategory',
  'preferredAirport',
  'travelPreferences',
  'airlineHotel',
  'dietary',
  'transportation',
  'endReason',
  'terminationDate',
  'outstandingBookings',
  'outstandingPayments',
  'outstandingCommissions',
  'finalBalance',
  'formerStatus',
  'finalNotes',
  'height',
  'weight',
  'clothingSize',
  'shoeSize',
  'hairColor',
  'eyeColor',
  'bust',
  'waist',
  'hips',
  'modelingCategory',
  'portfolioComp',
  'sagAftra',
  'actingCategory',
  'actingReel',
  'actingExperience',
  'actingTraining',
  'specialSkills',
  'languages',
  'accents',
  'primaryPlatform',
  'socialHandles',
  'totalFollowers',
  'totalSubscribers',
  'averageViews',
  'engagementRate',
  'contentCategory',
  'audienceDemographics',
  'rateCard',
  'mediaKit',
  'sport',
  'position',
  'team',
  'league',
  'division',
  'athleteStatus',
  'careerHighlights',
  'currentSponsors',
  'sponsorshipCategories',
  'nilStatus',
] as const satisfies readonly (keyof TalentUdf)[]

function str(data: ApplicationData | undefined, ...keys: string[]): string {
  if (!data) return ''
  for (const key of keys) {
    const value = data[key]
    if (value === true) return 'Yes'
    if (value === false) continue
    const text = String(value ?? '').trim()
    if (text) return text
  }
  return ''
}

export function emptyUdf(): TalentUdf {
  const next = { talentTypes: [] as TalentType[] } as TalentUdf
  for (const key of STRING_KEYS) next[key] = ''
  return next
}

export function isUdfBlank(udf: Partial<TalentUdf> | null | undefined): boolean {
  if (!udf) return true
  if (udf.talentTypes?.length) return false
  return STRING_KEYS.every((key) => !String(udf[key] || '').trim())
}

export function interestsToTalentTypes(raw: string): TalentType[] {
  const types: TalentType[] = []
  const parts = raw.split(',').map((part) => part.trim().toLowerCase()).filter(Boolean)
  for (const part of parts) {
    if (part.includes('model') && !types.includes('Modeling')) types.push('Modeling')
    if (part.includes('act') && !types.includes('Acting')) types.push('Acting')
    if ((part.includes('influenc') || part.includes('content')) && !types.includes('Influencing')) {
      types.push('Influencing')
    }
    if ((part.includes('sport') || part.includes('athlet')) && !types.includes('Sports')) {
      types.push('Sports')
    }
  }
  return types
}

export function prefillUdfFromApplication(
  app: Application | null | undefined,
  prospect?: AgencyProspect | null,
): TalentUdf {
  const data = app?.data || {}
  const udf = emptyUdf()
  udf.stageName = str(data, 'preferred_name', 'preferred_name')
  udf.talentTypes = interestsToTalentTypes(str(data, 'representation_interests', 'representation_interests'))
  udf.careerGoals = str(data, 'career_goals', 'career_goals')
  udf.preferredContact = prospect?.preferredContact || str(data, 'preferred_contact')
  udf.assignedAgent = prospect?.assignedAgentName || ''
  udf.representationType = prospect?.representationType || str(data, 'currently_represented', 'currently_represented')
  udf.contractStart = prospect?.contractStart || ''
  udf.contractEnd = prospect?.contractEnd || ''
  udf.emergencyName = str(data, 'parent_name', 'guardian_name', 'emergency_name') || prospect?.parentName || ''
  udf.emergencyPhone = str(data, 'parent_phone', 'guardian_phone', 'emergency_phone') || prospect?.parentPhone || ''
  udf.emergencyEmail = str(data, 'parent_email', 'guardian_email', 'guardian_invite_email', 'emergency_email') || prospect?.parentEmail || ''
  udf.emergencyRelationship = str(data, 'parent_relationship', 'guardian_relationship') || (prospect?.isMinor ? 'Parent / Guardian' : '')
  udf.availabilityStatus = str(data, 'availability', 'availability_status')
  udf.travelInternational = str(data, 'willing_to_travel', 'willing_to_travel')
  udf.preferredLocations = str(data, 'work_markets', 'work_markets', 'current_market')
  udf.socialHandles = [str(data, 'link_instagram', 'link_instagram'), str(data, 'influencer_handle', 'influencer_handle')]
    .filter(Boolean)
    .join(' ')
  udf.height = str(data, 'model_height', 'model_height')
  udf.weight = str(data, 'model_weight', 'model_weight')
  udf.clothingSize = str(data, 'model_clothing_size', 'model_clothing_size')
  udf.shoeSize = str(data, 'model_shoe_size', 'model_shoe_size')
  udf.hairColor = str(data, 'model_hair_color', 'model_hair_color')
  udf.eyeColor = str(data, 'model_eye_color', 'model_eye_color')
  udf.bust = str(data, 'model_bust', 'model_chest')
  udf.waist = str(data, 'model_waist')
  udf.hips = str(data, 'model_hips')
  udf.modelingCategory = str(data, 'model_categories', 'model_categories')
  udf.portfolioComp = str(data, 'model_website', 'doc_model_portfolio_name', 'doc_model_comp_name')
  udf.actingCategory = str(data, 'acting_categories', 'acting_categories')
  udf.actingExperience = str(data, 'acting_credits', 'acting_experience')
  udf.actingTraining = str(data, 'acting_training', 'acting_training')
  udf.actingReel = str(data, 'doc_acting_reel_name', 'acting_reel')
  udf.specialSkills = str(data, 'acting_skills')
  udf.languages = str(data, 'languages')
  udf.accents = str(data, 'accents')
  udf.sagAftra = str(data, 'sag_aftra', 'union_status')
  udf.primaryPlatform = str(data, 'influencer_primary_platform', 'influencer_primary_platform')
  udf.totalFollowers = str(data, 'influencer_followers', 'influencer_followers')
  udf.averageViews = str(data, 'influencer_avg_views', 'influencer_avg_views')
  udf.contentCategory = str(data, 'influencer_content_categories', 'influencer_content_categories')
  udf.mediaKit = str(data, 'influencer_media_kit')
  udf.sport = str(data, 'sport_primary', 'sport_primary')
  udf.position = str(data, 'sport_position', 'sport_position')
  udf.team = str(data, 'sport_team', 'sport_team')
  udf.league = str(data, 'sport_level', 'sport_level')
  udf.division = str(data, 'sport_school')
  udf.careerHighlights = str(data, 'sport_highlights', 'sport_highlights')
  udf.unionGuild = str(data, 'union_guild', 'union_status')
  return udf
}

export function mergeUdf(...layers: Array<Partial<TalentUdf> | null | undefined>): TalentUdf {
  const next = emptyUdf()
  for (const layer of layers) {
    if (!layer) continue
    if (layer.talentTypes?.length) next.talentTypes = [...layer.talentTypes]
    for (const key of STRING_KEYS) {
      const value = String(layer[key] || '').trim()
      if (value) next[key] = value
    }
  }
  return next
}

export function resolvedUdf(
  stored: Partial<TalentUdf> | null | undefined,
  app: Application | null | undefined,
  prospect?: AgencyProspect | null,
): TalentUdf {
  return mergeUdf(emptyUdf(), prefillUdfFromApplication(app, prospect), stored)
}
