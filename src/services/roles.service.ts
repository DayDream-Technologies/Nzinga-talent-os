import type { RoleDefinition, RolePermission, TalentStage } from '@/types'
import { STAGES } from '@/types/stages'
import {
  SYSTEM_ROLE_DEFINITIONS,
  getRoleCatalog,
  setRoleCatalog,
  slugFromRoleName,
} from '@/constants/roles'
import { invokeEdgeFunction } from '@/lib/edge-functions'
import { supabase, supabaseConfigured } from '@/lib/supabase'

const STORAGE_ROLE_CATALOG = 'nto_role_catalog'

function cloneDefs(defs: RoleDefinition[]): RoleDefinition[] {
  return defs.map((r) => ({
    ...r,
    stage_access: [...r.stage_access],
    module_paths: [...r.module_paths],
    permissions: [...r.permissions],
  }))
}

function readLocalCatalog(): RoleDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_ROLE_CATALOG)
    if (!raw) return cloneDefs(SYSTEM_ROLE_DEFINITIONS)
    const parsed = JSON.parse(raw) as RoleDefinition[]
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneDefs(SYSTEM_ROLE_DEFINITIONS)
    return parsed
  } catch {
    return cloneDefs(SYSTEM_ROLE_DEFINITIONS)
  }
}

function writeLocalCatalog(roles: RoleDefinition[]) {
  try {
    localStorage.setItem(STORAGE_ROLE_CATALOG, JSON.stringify(roles))
  } catch {
    /* ignore quota */
  }
  setRoleCatalog(roles)
}

function rowToDef(row: Record<string, unknown>): RoleDefinition {
  return {
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description || ''),
    is_system: Boolean(row.is_system),
    stage_access: (row.stage_access as TalentStage[]) || [],
    module_paths: (row.module_paths as string[]) || [],
    permissions: (row.permissions as RolePermission[]) || [],
    action_stage: (row.action_stage as TalentStage) || 'holding_entry',
  }
}

export interface RoleWriteInput {
  slug?: string
  name: string
  description: string
  copyFrom?: string
  stage_access: TalentStage[]
  module_paths: string[]
  permissions: RolePermission[]
  action_stage: TalentStage
}

export async function fetchRoleCatalog(): Promise<{ roles: RoleDefinition[]; error: string | null }> {
  const edge = await invokeEdgeFunction<{ roles: RoleDefinition[] }>('admin-users', { action: 'list_roles' })
  if (edge.ok && edge.data.roles?.length) {
    const roles = edge.data.roles.map((r) => rowToDef(r as unknown as Record<string, unknown>))
    setRoleCatalog(roles)
    return { roles, error: null }
  }

  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase.from('roles').select('*').order('name')
    if (!error && data?.length) {
      const roles = data.map((r) => rowToDef(r as Record<string, unknown>))
      setRoleCatalog(roles)
      return { roles, error: null }
    }
  }

  const roles = readLocalCatalog()
  setRoleCatalog(roles)
  return { roles, error: edge.ok ? null : edge.error }
}

export async function createRoleDef(
  input: RoleWriteInput,
): Promise<{ role: RoleDefinition | null; error: string | null }> {
  const existing = getRoleCatalog()
  let slug = (input.slug || slugFromRoleName(input.name)).trim()
  if (existing.some((r) => r.slug === slug)) {
    let n = 2
    while (existing.some((r) => r.slug === `${slug}_${n}`)) n += 1
    slug = `${slug}_${n}`
  }
  const copy = input.copyFrom ? existing.find((r) => r.slug === input.copyFrom) : undefined
  const role: RoleDefinition = {
    slug,
    name: input.name.trim(),
    description: input.description.trim(),
    is_system: false,
    stage_access: input.stage_access.length ? input.stage_access : copy?.stage_access || [],
    module_paths: input.module_paths.length ? input.module_paths : copy?.module_paths || [],
    permissions: (input.permissions.filter((p) => p !== 'admin_access') as RolePermission[]) || [],
    action_stage: input.action_stage || copy?.action_stage || 'holding_entry',
  }
  if (!STAGES.includes(role.action_stage)) role.action_stage = 'holding_entry'

  const edge = await invokeEdgeFunction<{ role: RoleDefinition }>('admin-users', {
    action: 'create_role',
    ...role,
  })
  if (edge.ok && edge.data.role) {
    const next = [...existing, rowToDef(edge.data.role as unknown as Record<string, unknown>)]
    setRoleCatalog(next)
    return { role: next[next.length - 1], error: null }
  }

  const next = [...existing, role]
  writeLocalCatalog(next)
  return { role, error: !edge.ok && supabaseConfigured ? edge.error : null }
}

export async function updateRoleDef(
  slug: string,
  patch: Partial<RoleWriteInput> & { name?: string; description?: string },
): Promise<{ role: RoleDefinition | null; error: string | null }> {
  const existing = getRoleCatalog()
  const current = existing.find((r) => r.slug === slug)
  if (!current) return { role: null, error: 'Role not found' }

  const updated: RoleDefinition = {
    ...current,
    name: patch.name?.trim() || current.name,
    description: patch.description !== undefined ? patch.description.trim() : current.description,
    stage_access: patch.stage_access || current.stage_access,
    module_paths: patch.module_paths || current.module_paths,
    permissions: current.is_system
      ? (patch.permissions as RolePermission[] | undefined) || current.permissions
      : ((patch.permissions || current.permissions).filter((p) => p !== 'admin_access') as RolePermission[]),
    action_stage: patch.action_stage || current.action_stage,
  }

  const edge = await invokeEdgeFunction<{ role: RoleDefinition }>('admin-users', {
    action: 'update_role_def',
    slug,
    name: updated.name,
    description: updated.description,
    stage_access: updated.stage_access,
    module_paths: updated.module_paths,
    permissions: updated.permissions,
    action_stage: updated.action_stage,
  })
  if (edge.ok && edge.data.role) {
    const next = existing.map((r) => (r.slug === slug ? rowToDef(edge.data.role as unknown as Record<string, unknown>) : r))
    setRoleCatalog(next)
    return { role: next.find((r) => r.slug === slug) || null, error: null }
  }

  const next = existing.map((r) => (r.slug === slug ? updated : r))
  writeLocalCatalog(next)
  return { role: updated, error: !edge.ok && supabaseConfigured ? edge.error : null }
}

export async function deleteRoleDef(slug: string): Promise<{ error: string | null }> {
  const current = getRoleCatalog().find((r) => r.slug === slug)
  if (!current) return { error: 'Role not found' }
  if (current.is_system) return { error: 'System roles cannot be deleted.' }

  const edge = await invokeEdgeFunction<{ ok: boolean }>('admin-users', { action: 'delete_role', slug })
  if (edge.ok) {
    setRoleCatalog(getRoleCatalog().filter((r) => r.slug !== slug))
    return { error: null }
  }

  const next = getRoleCatalog().filter((r) => r.slug !== slug)
  writeLocalCatalog(next)
  return { error: !edge.ok && supabaseConfigured ? edge.error : null }
}
