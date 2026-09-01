import { isS3Ref } from '@/lib/application-files'
import { resolveS3Url } from '@/lib/s3-storage'

/** Shared representation agreement body used for portal consent and downloadable contracts. */
export const REPRESENTATION_AGREEMENT_TEXT = `TALENT REPRESENTATION AGREEMENT

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

export function makeTextContractDocument(fileName: string, body: string) {
  const data = `data:text/plain;charset=utf-8,${encodeURIComponent(body)}`
  return { name: fileName, data, type: 'text/plain' }
}

export function downloadUploadedDoc(doc: { name: string; data: string; type?: string; cdnUrl?: string }) {
  const href = doc.cdnUrl || (isS3Ref(doc.data) ? resolveS3Url(doc.data) : doc.data)
  const a = document.createElement('a')
  a.href = href
  a.download = doc.name || 'contract.txt'
  a.rel = 'noopener'
  if (href.startsWith('http://') || href.startsWith('https://')) a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
