import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PLATFORM_BRAND } from '@/constants/company-branding'
import { TMXLogo, TMXMark } from '@/components/branding'
import { fetchApplicationById } from '@/services/application.service'
import {
  completeGuardianVerification,
  fetchGuardianInviteByToken,
  type GuardianProfilePayload,
} from '@/services/guardian.service'
import { AUTH_EMAIL_PATHS, getAuthEmailRedirectUrl } from '@/lib/auth-redirect'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { uploadOwnedFile } from '@/services/storage.service'
import type { Application } from '@/types'

const shell: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0c1520',
  color: '#e8eef4',
  fontFamily: "'Outfit','Segoe UI',sans-serif",
  padding: '24px 16px 48px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)',
  color: '#e8eef4',
  fontSize: 15,
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  minHeight: 44,
}

export function GuardianVerifyPage() {
  const [params] = useSearchParams()
  const appId = params.get('app') || ''
  const token = params.get('token') || ''

  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [authReady, setAuthReady] = useState(!supabaseConfigured)
  const [saving, setSaving] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState('')
  const [form, setForm] = useState<GuardianProfilePayload>({
    legal_first: '',
    legal_last: '',
    relationship: 'Parent',
    email: '',
    phone: '',
    address: '',
    consent_signature: '',
    consent_date: new Date().toISOString().slice(0, 10),
    consent_acknowledged: false,
  })

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setLoading(true)
      setError('')
      try {
        if (!appId || !token) {
          setError('Missing invitation link. Open the link from your email.')
          return
        }
        const invite = await fetchGuardianInviteByToken(token)
        if (!invite && supabaseConfigured) {
          // Invite may only exist on the application row in demo fallbacks
        }
        const found = await fetchApplicationById(appId)
        if (!found) {
          setError('Application not found.')
          return
        }
        if (!cancelled) {
          setApp(found)
          setForm((f) => ({
            ...f,
            email: found.guardian_email || String(found.data?.guardian_invite_email || '') || f.email,
          }))
        }

        if (supabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession()
          if (data.session) setAuthReady(true)
          else setAuthReady(false)
        }
      } catch {
        if (!cancelled) setError('Unable to load guardian invitation.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [appId, token])

  const applicantSummary = useMemo(() => {
    if (!app) return null
    const d = app.data || {}
    return {
      name: [d.legal_first, d.legal_last].filter(Boolean).join(' ') || app.talent_name,
      age: d.dob,
      interests: String(d.representation_interests || ''),
      email: String(d.email || app.talent_email),
      about: String(d.about_yourself || ''),
    }
  }, [app])

  async function requestMagicLink() {
    if (!supabaseConfigured || !supabase) {
      setAuthReady(true)
      return
    }
    const email = form.email.trim()
    if (!email) {
      setError('Enter your email to receive a secure login link.')
      return
    }
    setError('')
    const redirectTo = getAuthEmailRedirectUrl(AUTH_EMAIL_PATHS.guardianVerify, {
      app: appId,
      token,
    })
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        data: { account_type: 'guardian', application_id: appId, invite_token: token },
      },
    })
    if (otpErr) setError(otpErr.message)
    else setError('')
    alert('A verification message was sent. Check your inbox and follow the Verify Account button, then return here. If you did not request this, you can ignore the email.')
  }

  function setField<K extends keyof GuardianProfilePayload>(key: K, value: GuardianProfilePayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onFile(key: 'doc_gov_id' | 'doc_guardianship', file: File | undefined) {
    if (!file) return
    setError('')
    setUploadingDoc(key)
    try {
      const owner = appId || token || 'guardian'
      const stored = await uploadOwnedFile(file, `guardian/${owner}`, {
        uploadedBy: 'guardian',
        docType: key,
      })
      if (key === 'doc_gov_id') {
        setForm((f) => ({
          ...f,
          doc_gov_id: stored.data,
          doc_gov_id_name: stored.name,
          doc_gov_id_type: stored.type,
        }))
      } else {
        setForm((f) => ({
          ...f,
          doc_guardianship: stored.data,
          doc_guardianship_name: stored.name,
          doc_guardianship_type: stored.type,
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that file.')
    } finally {
      setUploadingDoc('')
    }
  }

  async function submit() {
    setError('')
    if (!form.legal_first.trim() || !form.legal_last.trim()) {
      setError('Enter your legal first and last name.')
      return
    }
    if (!form.relationship.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Complete all required guardian contact fields.')
      return
    }
    if (!form.doc_gov_id) {
      setError('Upload your government-issued ID.')
      return
    }
    if (!form.consent_acknowledged || !form.consent_signature.trim()) {
      setError('Review the application and provide electronic consent.')
      return
    }
    if (supabaseConfigured && !authReady) {
      setError('Confirm your identity using the verification message emailed to you before submitting.')
      return
    }

    setSaving(true)
    try {
      let authUid: string | undefined
      if (supabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession()
        authUid = data.session?.user.id
      }
      const { application, error: saveErr } = await completeGuardianVerification(
        appId,
        token,
        form,
        authUid,
      )
      if (saveErr || !application) {
        setError(saveErr || 'Could not complete verification.')
        return
      }
      setSuccess(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={shell}>
        <p style={{ textAlign: 'center', color: 'rgba(232,238,244,0.6)' }}>Loading guardian verification…</p>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ ...shell, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <TMXLogo size="md" theme="dark" />
        <h1 style={{ fontFamily: "'Syne',sans-serif", marginTop: 24 }}>Verification complete</h1>
        <p style={{ color: 'rgba(232,238,244,0.65)', maxWidth: 420, textAlign: 'center', lineHeight: 1.55 }}>
          Thank you. The applicant’s file can now proceed as a New / Lead for scouting review.
        </p>
        <Link to="/" style={{ color: '#86efac', marginTop: 16 }}>
          Return home
        </Link>
      </div>
    )
  }

  return (
    <div style={shell}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, maxWidth: 720, marginInline: 'auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none' }}>
          <TMXMark size="sm" />
          <span style={{ fontWeight: 700 }}>{PLATFORM_BRAND.name}</span>
        </Link>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <TMXLogo size="sm" theme="dark" />
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, marginTop: 20, marginBottom: 8 }}>
          Parent / Guardian verification
        </h1>
        <p style={{ color: 'rgba(232,238,244,0.6)', fontSize: 14, lineHeight: 1.55, marginBottom: 24 }}>
          Review the minor applicant’s information, upload your ID, and provide electronic consent. This is your
          secure account workflow — do not ask the minor to complete it for you.
        </p>

        {error && (
          <div role="alert" style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'rgba(220,38,38,0.15)', color: '#fca5a5', fontSize: 13 }}>
            {error}
          </div>
        )}

        {applicantSummary && (
          <section style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
            <h2 style={{ fontSize: 15, marginBottom: 10 }}>Applicant summary</h2>
            <p style={{ fontSize: 13, color: 'rgba(232,238,244,0.75)', lineHeight: 1.5 }}>
              <strong>{applicantSummary.name}</strong>
              {applicantSummary.age ? ` · DOB ${applicantSummary.age}` : ''}
              <br />
              Interests: {applicantSummary.interests || '—'}
              <br />
              Email: {applicantSummary.email}
            </p>
            {applicantSummary.about && (
              <p style={{ fontSize: 13, color: 'rgba(232,238,244,0.6)', marginTop: 8, lineHeight: 1.5 }}>
                {applicantSummary.about}
              </p>
            )}
          </section>
        )}

        {supabaseConfigured && !authReady && (
          <section style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.08)' }}>
            <p style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
              Authenticate with the email on this invitation to continue.
            </p>
            <button
              type="button"
              onClick={() => void requestMagicLink()}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#ca8a04',
                color: '#111',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Email me a secure link
            </button>
          </section>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {(
            [
              ['legal_first', 'Legal First Name'],
              ['legal_last', 'Legal Last Name'],
              ['relationship', 'Relationship to Applicant'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['address', 'Address'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} style={{ display: 'grid', gap: 6, fontSize: 12, color: 'rgba(232,238,244,0.6)' }}>
              {label} *
              <input
                style={inputStyle}
                value={String(form[key] || '')}
                onChange={(e) => setField(key, e.target.value)}
              />
            </label>
          ))}

          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'rgba(232,238,244,0.6)' }}>
            Government ID *
            <input type="file" accept="image/*,.pdf" onChange={(e) => void onFile('doc_gov_id', e.target.files?.[0])} />
            {uploadingDoc === 'doc_gov_id' && <span>Uploading…</span>}
            {form.doc_gov_id_name && <span style={{ color: '#86efac' }}>Uploaded: {form.doc_gov_id_name}</span>}
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'rgba(232,238,244,0.6)' }}>
            Guardianship documentation (if applicable)
            <input type="file" accept="image/*,.pdf" onChange={(e) => void onFile('doc_guardianship', e.target.files?.[0])} />
            {uploadingDoc === 'doc_guardianship' && <span>Uploading…</span>}
            {form.doc_guardianship_name && (
              <span style={{ color: '#86efac' }}>Uploaded: {form.doc_guardianship_name}</span>
            )}
          </label>

          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.45 }}>
            <input
              type="checkbox"
              checked={form.consent_acknowledged}
              onChange={(e) => setField('consent_acknowledged', e.target.checked)}
            />
            I have reviewed this application and consent as parent/legal guardian to Nzinga evaluating this minor
            applicant.
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'rgba(232,238,244,0.6)' }}>
            Electronic signature (full legal name) *
            <input
              style={inputStyle}
              value={form.consent_signature}
              onChange={(e) => setField('consent_signature', e.target.value)}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'rgba(232,238,244,0.6)' }}>
            Date *
            <input
              type="date"
              style={inputStyle}
              value={form.consent_date}
              onChange={(e) => setField('consent_date', e.target.value)}
            />
          </label>

          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            style={{
              marginTop: 8,
              padding: '14px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#16a34a',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Submitting…' : 'Submit guardian verification'}
          </button>
        </div>
      </div>
    </div>
  )
}
