import { Btn, Card, Field, MultiCheck, inputStyle } from '@/components/agency/AgencyUI'
import { TALENT_TYPES, type TalentType, type TalentUdf } from '@/types/udf'
import { T } from '@/lib/tokens'

type StringKey = Exclude<keyof TalentUdf, 'talentTypes'>

const GROUPS: { id: string; label: string; showIf?: TalentType; fields: { key: StringKey; label: string; kind?: 'textarea' | 'date' }[] }[] = [
  {
    id: 'general',
    label: 'General talent',
    fields: [
      { key: 'stageName', label: 'Professional / stage name' },
      { key: 'talentStatus', label: 'Talent status' },
      { key: 'representationType', label: 'Representation type' },
      { key: 'representationStart', label: 'Representation start', kind: 'date' },
      { key: 'representationEnd', label: 'Representation end', kind: 'date' },
      { key: 'assignedAgent', label: 'Assigned agent' },
      { key: 'assignedManager', label: 'Assigned manager' },
      { key: 'talentTier', label: 'Talent tier' },
      { key: 'careerGoals', label: 'Career goals', kind: 'textarea' },
      { key: 'preferredContact', label: 'Preferred contact method' },
    ],
  },
  {
    id: 'emergency',
    label: 'Contact & emergency',
    fields: [
      { key: 'emergencyName', label: 'Emergency contact name' },
      { key: 'emergencyRelationship', label: 'Relationship' },
      { key: 'emergencyPhone', label: 'Phone' },
      { key: 'emergencyEmail', label: 'Email' },
    ],
  },
  {
    id: 'contract',
    label: 'Representation & contract',
    fields: [
      { key: 'contractType', label: 'Contract type' },
      { key: 'contractStatus', label: 'Contract status' },
      { key: 'contractStart', label: 'Start date', kind: 'date' },
      { key: 'contractEnd', label: 'End date', kind: 'date' },
      { key: 'renewalDate', label: 'Renewal date', kind: 'date' },
      { key: 'commissionRate', label: 'Commission rate' },
      { key: 'managementFee', label: 'Management fee' },
      { key: 'exclusivity', label: 'Exclusivity' },
      { key: 'exclusivityCategory', label: 'Exclusivity category' },
      { key: 'contractNotes', label: 'Contract notes', kind: 'textarea' },
    ],
  },
  {
    id: 'booking',
    label: 'Booking & availability',
    fields: [
      { key: 'availabilityStatus', label: 'Availability status' },
      { key: 'unavailableStart', label: 'Unavailable start', kind: 'date' },
      { key: 'unavailableEnd', label: 'Unavailable end', kind: 'date' },
      { key: 'preferredLocations', label: 'Preferred booking locations' },
      { key: 'travelInternational', label: 'Travel / international availability' },
      { key: 'minBookingRate', label: 'Minimum booking rate' },
      { key: 'preferredJobTypes', label: 'Preferred job types' },
      { key: 'bookingNotes', label: 'Booking notes', kind: 'textarea' },
    ],
  },
  {
    id: 'financial',
    label: 'Financial',
    fields: [
      { key: 'paymentEntity', label: 'Payment entity' },
      { key: 'businessName', label: 'Business name' },
      { key: 'w9Status', label: 'W-9 status' },
      { key: 'paymentMethod', label: 'Payment method' },
      { key: 'financialCommissionRate', label: 'Commission rate' },
      { key: 'paymentTerms', label: 'Payment terms' },
      { key: 'paymentNotes', label: 'Payment notes', kind: 'textarea' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    fields: [
      { key: 'govIdType', label: 'Government ID type' },
      { key: 'govIdExpiration', label: 'Government ID expiration', kind: 'date' },
      { key: 'passportExpiration', label: 'Passport expiration', kind: 'date' },
      { key: 'workAuth', label: 'Work authorization' },
      { key: 'workAuthExpiration', label: 'Work authorization expiration', kind: 'date' },
      { key: 'unionGuild', label: 'Union / guild' },
      { key: 'licenseCert', label: 'License / certification' },
      { key: 'licenseExpiration', label: 'License expiration', kind: 'date' },
    ],
  },
  {
    id: 'brand',
    label: 'Brand / campaign',
    fields: [
      { key: 'preferredBrandCategories', label: 'Preferred brand categories' },
      { key: 'restrictedBrandCategories', label: 'Restricted brand categories' },
      { key: 'currentPartnerships', label: 'Current partnerships' },
      { key: 'brandExclusivity', label: 'Brand exclusivity' },
      { key: 'usageRights', label: 'Usage rights' },
      { key: 'campaignCategory', label: 'Campaign category' },
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    fields: [
      { key: 'preferredAirport', label: 'Preferred airport' },
      { key: 'travelPreferences', label: 'Travel preferences' },
      { key: 'airlineHotel', label: 'Airline / hotel preference' },
      { key: 'dietary', label: 'Dietary restrictions' },
      { key: 'transportation', label: 'Transportation requirements' },
    ],
  },
  {
    id: 'offboarding',
    label: 'Offboarding',
    fields: [
      { key: 'endReason', label: 'Representation end reason' },
      { key: 'terminationDate', label: 'Contract termination date', kind: 'date' },
      { key: 'outstandingBookings', label: 'Outstanding bookings' },
      { key: 'outstandingPayments', label: 'Outstanding payments' },
      { key: 'outstandingCommissions', label: 'Outstanding commissions' },
      { key: 'finalBalance', label: 'Final account balance' },
      { key: 'formerStatus', label: 'Former talent status' },
      { key: 'finalNotes', label: 'Final notes', kind: 'textarea' },
    ],
  },
  {
    id: 'model',
    label: 'Model',
    showIf: 'Modeling',
    fields: [
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'clothingSize', label: 'Clothing size' },
      { key: 'shoeSize', label: 'Shoe size' },
      { key: 'hairColor', label: 'Hair color' },
      { key: 'eyeColor', label: 'Eye color' },
      { key: 'bust', label: 'Bust / chest' },
      { key: 'waist', label: 'Waist' },
      { key: 'hips', label: 'Hips' },
      { key: 'modelingCategory', label: 'Modeling category' },
      { key: 'portfolioComp', label: 'Portfolio / comp card' },
    ],
  },
  {
    id: 'actor',
    label: 'Actor',
    showIf: 'Acting',
    fields: [
      { key: 'sagAftra', label: 'SAG-AFTRA status' },
      { key: 'actingCategory', label: 'Acting category' },
      { key: 'actingReel', label: 'Acting reel' },
      { key: 'actingExperience', label: 'Acting experience', kind: 'textarea' },
      { key: 'actingTraining', label: 'Acting training', kind: 'textarea' },
      { key: 'specialSkills', label: 'Special skills' },
      { key: 'languages', label: 'Languages' },
      { key: 'accents', label: 'Accents / dialects' },
    ],
  },
  {
    id: 'influencer',
    label: 'Influencer / content creator',
    showIf: 'Influencing',
    fields: [
      { key: 'primaryPlatform', label: 'Primary platform' },
      { key: 'socialHandles', label: 'Social media handles' },
      { key: 'totalFollowers', label: 'Total followers' },
      { key: 'totalSubscribers', label: 'Total subscribers' },
      { key: 'averageViews', label: 'Average views' },
      { key: 'engagementRate', label: 'Engagement rate' },
      { key: 'contentCategory', label: 'Content category' },
      { key: 'audienceDemographics', label: 'Audience demographics' },
      { key: 'rateCard', label: 'Rate card' },
      { key: 'mediaKit', label: 'Media kit' },
    ],
  },
  {
    id: 'athlete',
    label: 'Athlete',
    showIf: 'Sports',
    fields: [
      { key: 'sport', label: 'Sport' },
      { key: 'position', label: 'Position' },
      { key: 'team', label: 'Team' },
      { key: 'league', label: 'League' },
      { key: 'division', label: 'Division' },
      { key: 'athleteStatus', label: 'Athlete status' },
      { key: 'careerHighlights', label: 'Career highlights', kind: 'textarea' },
      { key: 'currentSponsors', label: 'Current sponsors' },
      { key: 'sponsorshipCategories', label: 'Sponsorship categories' },
      { key: 'nilStatus', label: 'NIL status' },
    ],
  },
]

export function UdfPanel({
  value,
  onChange,
  onSave,
  saved,
}: {
  value: TalentUdf
  onChange: (next: TalentUdf) => void
  onSave: () => void
  saved?: boolean
}) {
  function setField(key: StringKey, next: string) {
    onChange({ ...value, [key]: next })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: T.t3 }}>
          Working roster sheet. Application answers prefill empty fields; staff edits are saved on the person record.
        </div>
        <Btn onClick={onSave}>{saved ? 'Saved' : 'Save UDF'}</Btn>
      </div>
      <Card hover={false} style={{ marginBottom: 12 }}>
        <MultiCheck
          label="Talent type"
          options={[...TALENT_TYPES]}
          selected={value.talentTypes}
          onChange={(next) => onChange({ ...value, talentTypes: next as TalentType[] })}
        />
      </Card>
      {GROUPS.filter((group) => !group.showIf || value.talentTypes.includes(group.showIf)).map((group) => (
        <Card key={group.id} hover={false} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{group.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {group.fields.map((field) => (
              <div key={field.key} style={{ gridColumn: field.kind === 'textarea' ? '1 / -1' : undefined }}>
                <Field label={field.label}>
                  {field.kind === 'textarea' ? (
                    <textarea
                      style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                      value={value[field.key]}
                      onChange={(e) => setField(field.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type={field.kind === 'date' ? 'date' : 'text'}
                      style={inputStyle}
                      value={value[field.key]}
                      onChange={(e) => setField(field.key, e.target.value)}
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
