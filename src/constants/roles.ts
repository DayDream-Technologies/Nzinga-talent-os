import type { Role, RoleDefinition, RolePermission, TalentStage } from '@/types'
import {
  ACCOUNT_MANAGER_MODULE_PATHS,
  AGENT_MODULE_PATHS,
  ALL_MODULE_PATHS,
} from '@/constants/agency-module-paths'
import { STAGES } from '@/types/stages'

export const COMPANY_CODES: Record<string, boolean> = { NZG: true, NZINGA: true, TCG: true }

export const SYSTEM_ROLE_SLUGS = [
  'scout',
  'team1_lead',
  'ops_specialist',
  'team2_lead',
  'director',
  'success_manager',
] as const

const ALL_STAGES: TalentStage[] = [...STAGES]

export const SYSTEM_ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    slug: 'scout',
    name: 'Scouting Agent',
    description:
      'Identify, evaluate, and qualify prospects. Assemble a complete Client Packet for Success Manager review. Does not approve representation or negotiate contracts.',
    is_system: true,
    stage_access: ['holding_entry', 'scout_complete', 'not_viable'],
    module_paths: [...AGENT_MODULE_PATHS],
    permissions: ['submit_client_packet', 'send_application', 'track_own_submissions'],
    action_stage: 'holding_entry',
  },
  {
    slug: 'team1_lead',
    name: 'Team 1 Lead',
    description: 'Legacy Client Packet Review path into operations.',
    is_system: true,
    stage_access: ['scout_complete', 'team1_review'],
    module_paths: [...AGENT_MODULE_PATHS],
    permissions: ['return_packet'],
    action_stage: 'team1_review',
  },
  {
    slug: 'ops_specialist',
    name: 'Ops Specialist',
    description: 'Compliance, documents, and contract framework.',
    is_system: true,
    stage_access: ['team1_review', 'ops_processing'],
    module_paths: [...ACCOUNT_MANAGER_MODULE_PATHS],
    permissions: [],
    action_stage: 'ops_processing',
  },
  {
    slug: 'team2_lead',
    name: 'Team 2 Lead',
    description: 'Contract pending audit before director review.',
    is_system: true,
    stage_access: ['ops_processing', 'team2_audit'],
    module_paths: [...AGENT_MODULE_PATHS],
    permissions: [],
    action_stage: 'team2_audit',
  },
  {
    slug: 'director',
    name: 'Director',
    description: 'Full pipeline access, admin, and executive decisions.',
    is_system: true,
    stage_access: ALL_STAGES,
    module_paths: [...ALL_MODULE_PATHS],
    permissions: [
      'submit_client_packet',
      'send_application',
      'track_own_submissions',
      'approve_client_packet',
      'return_packet',
      'publish_contract',
      'admin_access',
    ],
    action_stage: 'executive_review',
  },
  {
    slug: 'success_manager',
    name: 'Success Manager',
    description:
      'Quality-assure Client Packets, approve prospects as Approved - Future, publish contracts, and onboard signed clients.',
    is_system: true,
    stage_access: ['team1_review', 'team2_audit', 'executive_review', 'signed_onboarding'],
    module_paths: [...ALL_MODULE_PATHS],
    permissions: ['approve_client_packet', 'return_packet', 'publish_contract'],
    action_stage: 'team1_review',
  },
]

let roleCatalog: RoleDefinition[] = SYSTEM_ROLE_DEFINITIONS.map((r) => ({
  ...r,
  stage_access: [...r.stage_access],
  module_paths: [...r.module_paths],
  permissions: [...r.permissions],
}))

export function getRoleCatalog(): RoleDefinition[] {
  return roleCatalog
}

export function setRoleCatalog(roles: RoleDefinition[]) {
  if (!roles.length) {
    roleCatalog = SYSTEM_ROLE_DEFINITIONS.map((r) => ({
      ...r,
      stage_access: [...r.stage_access],
      module_paths: [...r.module_paths],
      permissions: [...r.permissions],
    }))
    return
  }
  roleCatalog = roles.map((r) => ({
    ...r,
    stage_access: [...r.stage_access],
    module_paths: [...r.module_paths],
    permissions: [...(r.permissions || [])],
  }))
}

export function getRoleDef(slug: string): RoleDefinition {
  const found =
    roleCatalog.find((r) => r.slug === slug) || SYSTEM_ROLE_DEFINITIONS.find((r) => r.slug === slug)
  if (found) return found
  return {
    slug,
    name: slug,
    description: '',
    is_system: false,
    stage_access: [],
    module_paths: [...AGENT_MODULE_PATHS],
    permissions: [],
    action_stage: 'holding_entry',
  }
}

export function roleLabel(slug: string): string {
  return getRoleDef(slug).name
}

function catalogProxy<T>(pick: (def: RoleDefinition) => T): Record<string, T> {
  return new Proxy({} as Record<string, T>, {
    get(_t, key: string | symbol) {
      if (typeof key !== 'string') return undefined
      if (key === 'then' || key === '$$typeof') return undefined
      return pick(getRoleDef(key))
    },
    has(_t, key) {
      return typeof key === 'string' && getRoleCatalog().some((r) => r.slug === key)
    },
    ownKeys() {
      return getRoleCatalog().map((r) => r.slug)
    },
    getOwnPropertyDescriptor(_t, key) {
      if (typeof key !== 'string') return undefined
      return { enumerable: true, configurable: true, value: pick(getRoleDef(key)) }
    },
  })
}

/** Display names — includes custom roles once the catalog is loaded. */
export const ROLE_LABELS: Record<Role, string> = catalogProxy((d) => d.name)

export const ROLE_STAGE_ACCESS: Record<Role, TalentStage[]> = catalogProxy((d) => d.stage_access)

export const ROLE_ACTION_STAGE: Record<Role, TalentStage> = catalogProxy((d) => d.action_stage)

/** Stages where a scout may edit the talent packet (SOP: revision or initial build). */
export const SCOUT_EDITABLE_STAGES: TalentStage[] = ['holding_entry', 'scout_complete']

export function hasPermission(role: Role, permission: RolePermission): boolean {
  const def = getRoleDef(role)
  if (def.permissions.includes('admin_access')) return true
  return def.permissions.includes(permission)
}

export function isTalentVisibleToRole(
  talent: { stage: TalentStage; scout_id?: string | null },
  role: Role,
  userId?: string,
): boolean {
  const def = getRoleDef(role)
  if (def.permissions.includes('admin_access') || role === 'director') return true
  if ((def.stage_access || []).includes(talent.stage)) return true
  if (hasPermission(role, 'track_own_submissions') && userId && talent.scout_id === userId) return true
  return false
}

export function canScoutEditTalent(stage: TalentStage): boolean {
  return SCOUT_EDITABLE_STAGES.includes(stage)
}

export function isScoutReadOnlyView(
  role: Role,
  stage: TalentStage,
  scoutId: string | null | undefined,
  userId: string,
): boolean {
  return hasPermission(role, 'track_own_submissions') && scoutId === userId && !canScoutEditTalent(stage)
}

/** Stage is in the role's actionable RBAC set (director: all). */
export function canRoleAccessStage(role: Role, stage: TalentStage): boolean {
  if (hasPermission(role, 'admin_access') || role === 'director') return true
  return (getRoleDef(role).stage_access || []).includes(stage)
}

/**
 * Whether the user may drag a talent out of its current stage (and optionally into a target).
 * Locked / view-only stages are not movable; scout downstream tracking stays read-only.
 */
export function canRoleMoveTalent(
  role: Role,
  talent: { stage: TalentStage; scout_id?: string | null },
  userId: string,
  targetStage?: TalentStage,
): boolean {
  if (hasPermission(role, 'admin_access') || role === 'director') return true
  if (isScoutReadOnlyView(role, talent.stage, talent.scout_id, userId)) return false
  if (!canRoleAccessStage(role, talent.stage)) return false
  if (targetStage !== undefined && !canRoleAccessStage(role, targetStage)) return false
  return true
}

export function slugFromRoleName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return base || 'custom_role'
}
