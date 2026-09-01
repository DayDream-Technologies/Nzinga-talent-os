import { describe, expect, it } from 'vitest'
import {
  canManageTrainingVideos,
  canRoleAccessStage,
  getRoleDef,
  hasPermission,
  isScoutReadOnlyView,
  isTalentVisibleToRole,
  roleLabel,
  setRoleCatalog,
  slugFromRoleName,
  SYSTEM_ROLE_DEFINITIONS,
} from '@/constants/roles'
import type { RoleDefinition } from '@/types'

describe('role catalog and permissions', () => {
  it('labels scout as Scouting Agent', () => {
    expect(roleLabel('scout')).toBe('Scouting Agent')
  })

  it('grants Scouting Agent packet submit and own-submission tracking', () => {
    expect(hasPermission('scout', 'submit_client_packet')).toBe(true)
    expect(hasPermission('scout', 'send_application')).toBe(true)
    expect(hasPermission('scout', 'track_own_submissions')).toBe(true)
    expect(hasPermission('scout', 'approve_client_packet')).toBe(false)
    expect(hasPermission('scout', 'publish_contract')).toBe(false)
    expect(hasPermission('scout', 'admin_access')).toBe(false)
  })

  it('gives Success Manager packet QA and contract publish, not admin', () => {
    expect(hasPermission('success_manager', 'approve_client_packet')).toBe(true)
    expect(hasPermission('success_manager', 'publish_contract')).toBe(true)
    expect(canRoleAccessStage('success_manager', 'team1_review')).toBe(true)
    expect(canRoleAccessStage('success_manager', 'ops_processing')).toBe(false)
    expect(canRoleAccessStage('success_manager', 'team2_audit')).toBe(true)
    expect(hasPermission('success_manager', 'admin_access')).toBe(false)
  })

  it('treats admin_access as all permissions, director-only on system seed', () => {
    expect(hasPermission('director', 'admin_access')).toBe(true)
    expect(hasPermission('director', 'submit_client_packet')).toBe(true)
    expect(SYSTEM_ROLE_DEFINITIONS.filter((r) => r.permissions.includes('admin_access')).map((r) => r.slug)).toEqual([
      'director',
    ])
  })

  it('lets only directors manage TMX Academy videos', () => {
    expect(canManageTrainingVideos('director')).toBe(true)
    expect(canManageTrainingVideos('scout')).toBe(false)
    expect(canManageTrainingVideos('success_manager')).toBe(false)
  })

  it('lets a custom role copied from scout submit packets without slug scout', () => {
    const custom: RoleDefinition = {
      ...getRoleDef('scout'),
      slug: 'junior_scout',
      name: 'Junior Scout',
      is_system: false,
    }
    setRoleCatalog([...SYSTEM_ROLE_DEFINITIONS, custom])
    expect(hasPermission('junior_scout', 'submit_client_packet')).toBe(true)
    expect(isTalentVisibleToRole({ stage: 'holding_entry', scout_id: 'u9' }, 'junior_scout', 'u9')).toBe(true)
    expect(isScoutReadOnlyView('junior_scout', 'team1_review', 'u9', 'u9')).toBe(true)
    setRoleCatalog(SYSTEM_ROLE_DEFINITIONS)
  })

  it('builds unique-ish slugs from names', () => {
    expect(slugFromRoleName('Scouting Agent')).toBe('scouting_agent')
    expect(slugFromRoleName('  ')).toBe('custom_role')
  })
})
