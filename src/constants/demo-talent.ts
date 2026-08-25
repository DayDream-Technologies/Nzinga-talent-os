/** Demo-mode talent portal credentials (no Supabase). */

export const DEMO_TALENT_LOGIN = {
  email: 'maya@example.com',
  password: 'talent123',
  name: 'Maya Rivera',
  talentId: 't_maya',
} as const

export const DEMO_TALENT_SESSION_KEY = 'nto_demo_talent_email'

export const DEMO_TALENT_LOGIN_HINT = `Demo client: ${DEMO_TALENT_LOGIN.email} / ${DEMO_TALENT_LOGIN.password}`

export function isDemoTalentLogin(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_TALENT_LOGIN.email &&
    password === DEMO_TALENT_LOGIN.password
  )
}
