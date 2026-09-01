import { useMemo, useState } from 'react'
import {
  portalCard,
  portalGhost,
  portalInput,
  portalMuted,
  portalPrimary,
  useTalentPortalPrefs,
} from '@/components/talent-portal/TalentPortalShell'
import { useTalentPortal } from '@/hooks/useTalentPortal'
import { useResolvedImageUrl } from '@/hooks/useResolvedImageUrl'
import { isImageDoc, resolveProfilePhoto, uploadProfilePhoto } from '@/lib/profile-photo'
import { useImageCropper } from '@/components/ui/ImageCropper'
import { cropAspectForField } from '@/lib/crop-image'
import { mergeUdf } from '@/lib/talent-udf'
import type { TalentUdf } from '@/types/udf'

const MEASUREMENT_FIELDS: Array<{ key: keyof TalentUdf; label: string }> = [
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
  { key: 'clothingSize', label: 'Clothing size' },
  { key: 'shoeSize', label: 'Shoe size' },
  { key: 'hairColor', label: 'Hair color' },
  { key: 'eyeColor', label: 'Eye color' },
  { key: 'bust', label: 'Bust / chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
]

const SOCIAL_FIELDS: Array<{ key: keyof TalentUdf; label: string }> = [
  { key: 'primaryPlatform', label: 'Primary platform' },
  { key: 'socialHandles', label: 'Handles' },
  { key: 'totalFollowers', label: 'Total followers' },
  { key: 'engagementRate', label: 'Engagement rate' },
  { key: 'contentCategory', label: 'Content category' },
]

const CONTACT_FIELDS: Array<{ key: keyof TalentUdf; label: string }> = [
  { key: 'preferredContact', label: 'Preferred contact' },
  { key: 'emergencyName', label: 'Emergency contact name' },
  { key: 'emergencyRelationship', label: 'Relationship' },
  { key: 'emergencyPhone', label: 'Emergency phone' },
  { key: 'emergencyEmail', label: 'Emergency email' },
]

export function TalentSettingsPage() {
  const { profile, talent, displayName, prospect, rosterTalent, updateTalent, updateProspect } = useTalentPortal()
  const { prefs, setPrefs } = useTalentPortalPrefs()
  const { cropImage, cropper } = useImageCropper()
  const [notice, setNotice] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [phone, setPhone] = useState(rosterTalent?.phone || prospect?.phone || '')

  const udf = mergeUdf(rosterTalent?.udf, prospect?.udf)
  const [draft, setDraft] = useState<Partial<TalentUdf>>({})
  const values = useMemo(() => ({ ...udf, ...draft }), [udf, draft])

  const photo = resolveProfilePhoto({
    pipelineTalent: talent,
    rosterTalent,
    prospect,
  })
  const photoUrl = useResolvedImageUrl(photo)

  function fieldValue(key: keyof TalentUdf): string {
    const raw = values[key]
    return typeof raw === 'string' ? raw : ''
  }

  function setField(key: keyof TalentUdf, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function saveSheet(e: React.FormEvent) {
    e.preventDefault()
    const next = mergeUdf(rosterTalent?.udf, prospect?.udf, draft)
    if (rosterTalent) updateTalent(rosterTalent.id, { udf: next, phone })
    if (prospect) updateProspect(prospect.id, { udf: next, phone })
    setDraft({})
    setNotice('Profile details saved. Your agency roster sheet is updated.')
  }

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError('')
    if (!file.type.startsWith('image/')) {
      setPhotoError('Choose a JPG, PNG, GIF, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Keep the photo under 5 MB.')
      return
    }
    try {
      const cropped = await cropImage(file, { aspect: cropAspectForField('profile_photo'), title: 'Crop profile photo' })
      if (!cropped) return
      const ownerId = rosterTalent?.id || prospect?.id || talent?.id || 'unassigned'
      const photoDoc = await uploadProfilePhoto(cropped, ownerId, 'talent')
      if (rosterTalent) updateTalent(rosterTalent.id, { profilePhoto: photoDoc })
      if (prospect) updateProspect(prospect.id, { profilePhoto: photoDoc })
      setNotice('Profile photo updated.')
    } catch {
      setPhotoError('Could not upload that image. Try another file.')
    }
  }

  return (
    <>
      {cropper}
      <h1 style={{ fontFamily: "'Syne', 'Outfit', sans-serif", fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
        Settings
      </h1>
      <p style={{ color: portalMuted, fontSize: 14, marginBottom: 22 }}>
        Appearance, notifications, photo, and the measurements and socials on your agency roster sheet.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Profile photo</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--tp-inset)',
                border: '1px solid var(--tp-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 24,
              }}
            >
              {photo && isImageDoc(photo) && photoUrl ? (
                <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                displayName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() || '')
                  .join('')
              )}
            </div>
            <div>
              <label style={{ ...portalGhost, display: 'inline-block' }}>
                Upload new photo
                <input type="file" accept="image/*" onChange={(ev) => void onPhotoChange(ev)} style={{ display: 'none' }} />
              </label>
              <p style={{ fontSize: 12, color: portalMuted, margin: '8px 0 0' }}>JPG, PNG, GIF, or WebP · 5 MB max</p>
              {photoError && <p style={{ fontSize: 12, color: 'var(--tp-danger)', margin: '6px 0 0' }}>{photoError}</p>}
            </div>
          </div>
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Appearance</h2>
          <p style={{ fontSize: 13, color: portalMuted, margin: '0 0 12px' }}>Dark mode is the default talent portal look.</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {(['dark', 'light'] as const).map((theme) => (
              <label key={theme} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, textTransform: 'capitalize' }}>
                <input
                  type="radio"
                  name="talent-theme"
                  checked={prefs.theme === theme}
                  onChange={() => setPrefs({ ...prefs, theme })}
                />
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </label>
            ))}
          </div>
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Notifications</h2>
          <p style={{ fontSize: 13, color: portalMuted, margin: '0 0 12px' }}>
            Choose whether updates appear in this portal, go to email with your agent, or both.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {(
              [
                { id: 'both', label: 'Email and portal' },
                { id: 'email', label: 'Email only' },
                { id: 'portal', label: 'Portal only' },
              ] as const
            ).map((opt) => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="radio"
                  name="talent-notifications"
                  checked={prefs.notifications === opt.id}
                  onChange={() => setPrefs({ ...prefs, notifications: opt.id })}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </section>

        <section style={portalCard}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Account</h2>
          <p style={{ fontSize: 13, color: portalMuted, margin: '0 0 12px' }}>{profile?.email}</p>
          <label style={{ fontSize: 12, color: portalMuted, display: 'block', maxWidth: 360 }}>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...portalInput, marginTop: 6 }} />
          </label>
        </section>

        <form onSubmit={saveSheet} style={{ display: 'grid', gap: 16 }}>
          <section style={portalCard}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Measurements</h2>
            <p style={{ fontSize: 13, color: portalMuted, margin: '0 0 12px' }}>
              These fields live on the UDF roster sheet your agency uses for bookings.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {MEASUREMENT_FIELDS.map((field) => (
                <label key={field.key} style={{ fontSize: 12, color: portalMuted }}>
                  {field.label}
                  <input
                    value={fieldValue(field.key)}
                    onChange={(e) => setField(field.key, e.target.value)}
                    style={{ ...portalInput, marginTop: 6 }}
                  />
                </label>
              ))}
            </div>
          </section>

          <section style={portalCard}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Socials</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {SOCIAL_FIELDS.map((field) => (
                <label key={field.key} style={{ fontSize: 12, color: portalMuted }}>
                  {field.label}
                  <input
                    value={fieldValue(field.key)}
                    onChange={(e) => setField(field.key, e.target.value)}
                    style={{ ...portalInput, marginTop: 6 }}
                  />
                </label>
              ))}
            </div>
          </section>

          <section style={portalCard}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Contact preferences</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {CONTACT_FIELDS.map((field) => (
                <label key={field.key} style={{ fontSize: 12, color: portalMuted }}>
                  {field.label}
                  <input
                    value={fieldValue(field.key)}
                    onChange={(e) => setField(field.key, e.target.value)}
                    style={{ ...portalInput, marginTop: 6 }}
                  />
                </label>
              ))}
            </div>
            <button type="submit" style={{ ...portalPrimary, width: 'fit-content', marginTop: 14 }}>
              Save profile details
            </button>
          </section>
        </form>

        {notice && <p style={{ fontSize: 13, color: '#16a34a', margin: 0 }}>{notice}</p>}
      </div>
    </>
  )
}
