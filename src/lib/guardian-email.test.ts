import { describe, expect, it } from 'vitest'
import {
  GUARDIAN_EMAIL_BUTTON,
  GUARDIAN_EMAIL_SUBJECT,
  buildGuardianLetter,
  shouldSendGuardianInvite,
  splitPersonName,
} from '@/lib/guardian-email'

describe('guardian access email', () => {
  it('explains why the parent was contacted and includes the setup link', () => {
    const letter = buildGuardianLetter({
      parentFirst: 'Pat',
      parentLast: 'Rivera',
      childFirst: 'Kai',
      childLast: 'Johnson',
      actionUrl: 'https://talentmanagerx.com/guardian/verify?app=app_1&token=abc',
    })
    expect(letter.subject).toBe(GUARDIAN_EMAIL_SUBJECT)
    expect(letter.text).toContain('Hi Pat Rivera,')
    expect(letter.text).toContain('Your child, Kai Johnson, has listed you as their legal guardian')
    expect(letter.text).toContain('verify your email address, set up your parent/guardian access')
    expect(letter.text).toContain('https://talentmanagerx.com/guardian/verify?app=app_1&token=abc')
    expect(letter.text).toContain('If you are not the intended recipient')
    expect(letter.html).toContain(GUARDIAN_EMAIL_BUTTON)
    expect(letter.html).toContain('href="https://talentmanagerx.com/guardian/verify?app=app_1&amp;token=abc"')
  })

  it('escapes names so they cannot change the email markup', () => {
    const letter = buildGuardianLetter({
      parentFirst: '<script>',
      parentLast: 'Rivera',
      childFirst: 'Kai',
      childLast: 'Johnson',
      actionUrl: 'https://talentmanagerx.com/guardian/verify',
    })
    expect(letter.html).toContain('Hi &lt;script&gt; Rivera,')
    expect(letter.html).not.toContain('<script>')
  })

  it('splits a staff parent name into first and last', () => {
    expect(splitPersonName('Pat Rivera')).toEqual({ first: 'Pat', last: 'Rivera' })
    expect(splitPersonName('Mary Ann Smith')).toEqual({ first: 'Mary', last: 'Ann Smith' })
  })

  it('sends again only when the parent email changes, unless this is the minor submit', () => {
    const previous = { guardian_email: 'pat@example.com', status: 'pending' }
    expect(shouldSendGuardianInvite(previous, 'pat@example.com', false)).toBe(false)
    expect(shouldSendGuardianInvite(previous, 'sam@example.com', false)).toBe(true)
    expect(shouldSendGuardianInvite(previous, 'pat@example.com', true)).toBe(true)
    expect(shouldSendGuardianInvite(null, 'pat@example.com', false)).toBe(true)
  })
})