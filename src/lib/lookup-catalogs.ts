const STORAGE_KEY = 'nto_lookup_catalogs'

export const LOOKUP_SEEDS: Record<string, string[]> = {
  'Acquisition Channels': ['Referral', 'Social Media', 'Showcase', 'Direct Inquiry'],
  'Industry Contact Roles': ['Talent', 'Casting Director', 'Publicist', 'Sponsor', 'Venue Manager'],
  'Roster Groups': ['Modeling', 'Acting', 'Influencing', 'Athletics'],
  'Representation Terms': ['1-Year Exclusive'],
  'Passed / Declined Reasons': ['Rate Conflict', 'Passed Audition', 'Signed Elsewhere'],
  'Talent Rider / Special Requirements': ['Special equipment', 'Travel preference'],
  'Talent Skillsets': ['Stunt Work', 'French Fluency', 'DJ Gear'],
  'Booking Priority Levels': ['Low', 'Normal', 'Urgent'],
  'Request / Case Categories': ['Travel & Logistics', 'Payment Issue', 'Contract Dispute', 'Media Request'],
  'Case Statuses': ['New', 'In Review', 'Dispatched', 'Closed'],
  'Media & Asset Categories': ['Headshots', 'Press Kits', 'Comp Cards', 'Contracts', 'W-9s'],
  'Contact Information Types': ['Manager', 'Agent', 'Legal counsel', 'Emergency contact'],
  'Recruitment Stages': [
    'New Prospect',
    'Application Sent',
    'Application Completed',
    'Screening Completed',
    'Application Approved',
    'Contact Published',
    'Contract Completed',
  ],
}

type Item = { name: string; active: boolean; sort: number }

export function catalogNames(category: string, fallback?: string[]): string[] {
  const seed = fallback || LOOKUP_SEEDS[category] || []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed
    const all = JSON.parse(raw) as Record<string, Item[]>
    const items = all[category]
    if (!items?.length) return seed
    return [...items]
      .filter((item) => item.active)
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.name)
  } catch {
    return seed
  }
}
