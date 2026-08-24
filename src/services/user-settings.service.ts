import type { User, UserUiSettings } from '@/types'
import { persistErrorMessage } from '@/lib/persist-error'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import {
  hydrateUserSettings,
  initialsFromName,
  writeCachedUserSettings,
  type CachedUserSettings,
} from '@/lib/user-settings'

export interface SaveUserSettingsInput {
  name: string
  title: string
  settings: UserUiSettings
}

export async function saveUserSettings(
  user: User,
  input: SaveUserSettingsInput,
): Promise<{ user: User; error: string | null }> {
  const name = input.name.trim()
  const title = input.title.trim()
  const initials = initialsFromName(name)
  const settings = input.settings
  const cached: CachedUserSettings = { name, title, initials, settings }
  const next: User = { ...user, name, title, initials, settings }

  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('users')
      .update({ name, title, initials, settings })
      .eq('id', user.id)
      .select('*')
      .maybeSingle()

    if (error) {
      return { user, error: persistErrorMessage(error) }
    }
    if (!data) {
      return {
        user,
        error: 'Could not save to your account. Sign in again and retry.',
      }
    }
    const saved = hydrateUserSettings(data as User)
    writeCachedUserSettings(saved.id, {
      name: saved.name,
      title: saved.title,
      initials: saved.initials,
      settings: saved.settings ?? settings,
    })
    return { user: { ...user, ...saved, password: user.password }, error: null }
  }

  writeCachedUserSettings(user.id, cached)
  return { user: next, error: null }
}
