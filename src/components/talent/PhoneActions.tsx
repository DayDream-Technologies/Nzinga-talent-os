// @ts-nocheck
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { T, Btn, FTextarea } from '@/components/ui-compat'
import { makeCall, sendSms, getRcConnectionStatus } from '@/lib/phone'
import type { RcConnectionStatus } from '@/lib/ringcentral-types'

interface PhoneActionsProps {
  talentId: string
  phone: string
  talentName: string
  onSuccess?: () => void
}

export function PhoneActions({ talentId, phone, talentName, onSuccess }: PhoneActionsProps) {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'error'>('idle')
  const [callError, setCallError] = useState('')
  const [showSms, setShowSms] = useState(false)
  const [smsText, setSmsText] = useState('')
  const [smsSending, setSmsSending] = useState(false)
  const [smsResult, setSmsResult] = useState('')
  const [rcStatus, setRcStatus] = useState<RcConnectionStatus>({ connected: false })
  const [rcLoading, setRcLoading] = useState(true)

  useEffect(() => {
    getRcConnectionStatus().then((status) => {
      setRcStatus(status)
      setRcLoading(false)
    })
  }, [])

  const rcReady = rcStatus.connected && !rcStatus.expired

  async function handleCall() {
    if (!phone || !rcReady) return
    setCallState('calling')
    setCallError('')

    const result = await makeCall(talentId, phone)
    if (result.status === 'initiated') {
      setCallState('connected')
      onSuccess?.()
      setTimeout(() => setCallState('idle'), 5000)
    } else {
      setCallState('error')
      setCallError(result.message || 'Call failed')
      setTimeout(() => setCallState('idle'), 4000)
    }
  }

  async function handleSms() {
    if (!phone || !smsText.trim() || !rcReady) return
    setSmsSending(true)
    setSmsResult('')

    const result = await sendSms(talentId, phone, smsText.trim())
    setSmsSending(false)

    if (result.status === 'sent') {
      onSuccess?.()
      setSmsText('')
      setSmsResult('sent')
      setTimeout(() => { setSmsResult(''); setShowSms(false) }, 2000)
    } else {
      setSmsResult(result.error || 'SMS failed')
    }
  }

  if (!phone) return null

  return (
    <div style={{ marginTop: 8 }}>
      {!rcLoading && !rcReady && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 6, padding: '6px 10px', marginBottom: 8, fontSize: 11, color: '#b45309' }}>
          {rcStatus.expired
            ? 'RingCentral token expired. '
            : 'RingCentral not connected. '}
          <Link to="/settings" style={{ color: '#b45309', fontWeight: 700 }}>Connect in Settings →</Link>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: showSms ? 8 : 0 }}>
        <span style={{ fontSize: 12, color: T.t2, fontWeight: 500 }}>{phone}</span>

        <button
          onClick={handleCall}
          disabled={callState === 'calling' || !rcReady}
          style={{
            background: callState === 'connected' ? T.green : callState === 'error' ? T.red : '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: 5,
            padding: '3px 9px',
            fontSize: 11,
            fontWeight: 600,
            cursor: callState === 'calling' || !rcReady ? 'not-allowed' : 'pointer',
            opacity: rcReady ? 1 : 0.5,
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
          title={rcReady ? 'Click to call via RingCentral' : 'Connect RingCentral in Settings first'}
        >
          {callState === 'calling' ? '⟳ Ringing…' : callState === 'connected' ? '✓ Connected' : callState === 'error' ? '✗ Failed' : '📞 Call'}
        </button>

        <button
          onClick={() => setShowSms(!showSms)}
          disabled={!rcReady}
          style={{
            background: showSms ? T.blue : 'rgba(37,99,235,0.1)',
            color: showSms ? '#fff' : T.blue,
            border: `1px solid ${T.blue}44`,
            borderRadius: 5,
            padding: '3px 9px',
            fontSize: 11,
            fontWeight: 600,
            cursor: rcReady ? 'pointer' : 'not-allowed',
            opacity: rcReady ? 1 : 0.5,
            fontFamily: 'inherit',
          }}
        >
          💬 SMS
        </button>

        {callError && <span style={{ fontSize: 10, color: T.red }}>{callError}</span>}
      </div>

      {showSms && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
          <FTextarea value={smsText} onChange={setSmsText} placeholder={`Text message to ${talentName}…`} rows={2} />
          <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
            <Btn sm variant="primary" onClick={handleSms} disabled={smsSending || !smsText.trim() || !rcReady}>
              {smsSending ? '⟳ Sending…' : '📤 Send SMS'}
            </Btn>
            <Btn sm variant="ghost" onClick={() => setShowSms(false)}>Cancel</Btn>
            {smsResult === 'sent' && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ Sent!</span>}
            {smsResult && smsResult !== 'sent' && <span style={{ fontSize: 11, color: T.red }}>{smsResult}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
