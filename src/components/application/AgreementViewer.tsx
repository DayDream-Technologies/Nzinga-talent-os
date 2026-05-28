import { useState, useRef, useCallback } from 'react'

const AGREEMENT_TEXT = `TALENT REPRESENTATION AGREEMENT

Nzinga Talent Group, LLC ("Company")

This agreement ("Agreement") is entered into between the undersigned talent ("Talent") and Nzinga Talent Group, LLC ("Company").

1. SCOPE OF SERVICES
The Company agrees to provide talent management services including but not limited to: scouting opportunities, negotiating deals, brand partnership facilitation, content strategy guidance, and career development support.

2. DATA COLLECTION & PRIVACY
Talent consents to the collection, storage, and processing of personal data including but not limited to: name, contact information, social media metrics, financial information, and government-issued identification documents. All data is stored securely and used solely for talent evaluation, representation, and business operations.

3. COMMUNICATION CONSENT
Talent agrees to be contacted by Company representatives via email, phone, text message, or social media direct message regarding opportunities, updates, and administrative matters related to their representation.

4. REPRESENTATION TERMS
a) The initial term of representation shall be discussed and agreed upon separately.
b) Commission rates and payment terms shall be outlined in the full representation contract.
c) Either party may terminate with written notice as specified in the full contract.

5. TALENT OBLIGATIONS
Talent agrees to:
- Provide accurate and truthful information at all times
- Notify Company of any changes to contact information or social media accounts
- Maintain professional conduct in all business dealings facilitated by Company
- Not enter conflicting agreements without prior written consent from Company

6. COMPANY OBLIGATIONS
Company agrees to:
- Act in good faith and in Talent's best interest
- Maintain confidentiality of Talent's personal and financial information
- Provide transparent communication regarding opportunities and decisions
- Comply with all applicable laws and regulations

7. INTELLECTUAL PROPERTY
All pre-existing intellectual property remains the property of its respective owner. Any jointly created materials shall be subject to separate agreement.

8. LIMITATION OF LIABILITY
Neither party shall be liable for indirect, incidental, or consequential damages arising from this Agreement.

9. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Georgia, without regard to conflict of law principles.

10. ENTIRE AGREEMENT
This Agreement, together with any subsequent full representation contract, constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.

By providing your digital signature below, you acknowledge that you have read, understood, and agree to the terms outlined in this Agreement.`

interface AgreementViewerProps {
  onScrollComplete: (complete: boolean) => void
  hasScrolledToBottom: boolean
}

export function AgreementViewer({ onScrollComplete, hasScrolledToBottom }: AgreementViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollPct, setScrollPct] = useState(0)

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const pct = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
    setScrollPct(pct)
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      onScrollComplete(true)
    }
  }, [onScrollComplete])

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📋 Talent Representation Agreement</span>
        {!hasScrolledToBottom && <span style={{ color: '#f59e0b', fontSize: 10 }}>⚠ Scroll to bottom to enable consent</span>}
        {hasScrolledToBottom && <span style={{ color: '#4ade80', fontSize: 10 }}>✓ Agreement reviewed</span>}
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          maxHeight: 360,
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${hasScrolledToBottom ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 8,
          padding: '16px 20px',
          fontFamily: 'Georgia, serif',
          fontSize: 12,
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.75)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {AGREEMENT_TEXT}
      </div>
      <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${scrollPct}%`, background: hasScrolledToBottom ? '#4ade80' : '#7c3aed', transition: 'width 0.2s' }} />
      </div>
    </div>
  )
}
