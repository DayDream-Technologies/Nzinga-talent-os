import { isS3Ref } from '@/lib/application-files'
import { resolveS3Url } from '@/lib/s3-storage'

/** Application Acknowledgment & Consent Agreement shown before electronic signature. */
export const REPRESENTATION_AGREEMENT_TEXT = `APPLICATION ACKNOWLEDGMENT & CONSENT AGREEMENT
Nzinga Management Agency LLC
("Nzinga" or the "Agency")

This Application Acknowledgment & Consent Agreement ("Agreement") is entered into by the individual submitting an application for potential talent representation ("Applicant") and Nzinga Management Agency LLC, a subsidiary of Nzinga Group LLC ("Agency").

By reviewing and electronically signing this Agreement, the Applicant acknowledges and agrees to the terms below as a condition of submitting an application for consideration by the Agency.

1. APPLICATION PURPOSE & NO GUARANTEE OF REPRESENTATION
The Applicant understands that this Agreement governs certain acknowledgments, permissions, and responsibilities associated with the application and evaluation process. It does not constitute a talent representation agreement, management contract, or commitment by the Agency to provide representation or management services.

Submitting an application, completing an evaluation, participating in a screening or discovery call, or receiving communication from the Agency does not guarantee acceptance, a representation offer, or a contractual relationship.

The Agency reserves the right to review applications, evaluate applicants, request additional information, and determine whether an applicant meets its selection criteria. Representation is established only after the Agency has approved the Applicant and the parties have executed a separate, formal talent representation agreement.

Until a formal representation agreement has been executed, the Applicant is not considered a represented client of the Agency, and the Agency has no obligation to provide talent management, career development, booking, negotiation, or other representation services.

2. INFORMATION COLLECTION & PRIVACY
The Applicant acknowledges that the Agency may collect, receive, review, and process information submitted during the application and evaluation process. This information may include, where applicable:

Name, age or date of birth, contact information, and location.

Professional background, experience, qualifications, and career goals.

Social media profiles, public-facing content, audience information, and relevant platform analytics.

Photographs, portfolios, resumes, reels, performance materials, and other application submissions.

Additional documentation or information reasonably necessary for application evaluation, identity verification, eligibility review, or authorized screening procedures.

The Agency will use Applicant information for legitimate business purposes associated with application processing, talent evaluation, eligibility determination, communications, recordkeeping, and related administrative operations.

Information will be handled in accordance with applicable privacy and data protection requirements and the Agency's applicable privacy practices. Information may be shared with authorized personnel or service providers when reasonably necessary to process the application or perform an authorized function, subject to applicable requirements.

The Applicant should not submit sensitive financial information, government-issued identification, or other highly sensitive documents unless specifically requested through an appropriate process.

3. COMMUNICATION CONSENT
The Applicant authorizes the Agency to contact them regarding their application, requests for additional information, evaluation updates, discovery calls, screening procedures, potential next steps, and related administrative matters.

Communications may be sent through the contact methods the Applicant provides, including email, telephone, text message, or other designated communication channels.

The Applicant agrees to provide accurate contact information and to notify the Agency of material changes that may affect its ability to communicate with them.

This consent relates to application-related communications and does not, by itself, establish a representation relationship or authorize the Agency to act on the Applicant's behalf.

4. APPLICATION REVIEW & EVALUATION
The Applicant acknowledges that the Agency may evaluate submitted information in determining whether the Applicant aligns with its representation standards, business model, departmental needs, and current or anticipated opportunities.

The Agency may request additional materials, conduct interviews or discovery calls, verify submitted information, or initiate applicable screening procedures where appropriate and legally permitted.

The Applicant agrees to provide truthful, accurate, and reasonably complete information and understands that material misrepresentations, omissions, or falsified documentation may result in the application being declined or withdrawn from consideration.

The Agency does not guarantee a particular review timeline, application outcome, opportunity, or future offer of representation.

5. NO REPRESENTATION, EXCLUSIVITY, OR FINANCIAL OBLIGATION
The Applicant understands that signing this Agreement does not:

Establish a client, manager-talent, agent-talent, or other representation relationship.

Require the Agency to accept the Applicant or offer a representation contract.

Authorize the Agency to negotiate, enter into, or execute agreements on the Applicant's behalf.

Create any commission, fee, payment, or other financial obligation to the Agency solely because an application was submitted.

Require the Applicant to enter into an exclusive relationship with the Agency.

Restrict the Applicant from pursuing independent professional activities or opportunities before entering into a separate representation agreement.

Any future representation terms, including the scope of services, representation period, exclusivity, commissions, responsibilities, and termination provisions, will be addressed in a separate written representation agreement if the Agency offers representation and the Applicant accepts.

6. APPLICANT RESPONSIBILITIES
The Applicant agrees to:

Submit truthful and accurate application information.

Provide additional information or documentation reasonably requested for the evaluation process.

Maintain respectful and professional communication with Agency representatives.

Notify the Agency if submitted information materially changes or becomes inaccurate.

Ensure that materials submitted are owned by the Applicant or may lawfully be provided for evaluation.

Obtain any necessary parent or legal guardian involvement and authorization where required by applicable law.

These responsibilities apply to the application process and do not independently create an obligation to become a client of the Agency.

7. CONFIDENTIALITY & SUBMITTED MATERIALS
The Applicant retains ownership of their pre-existing intellectual property, photographs, videos, portfolio materials, and other content submitted with their application.

The Applicant grants the Agency permission to review and use submitted materials internally for application evaluation, eligibility review, and consideration for potential representation. This limited permission does not transfer ownership of the materials to the Agency or authorize their public use for advertising, promotional campaigns, or unrelated commercial purposes.

Any broader use of the Applicant's name, likeness, image, voice, or submitted creative materials will require an appropriate separate authorization where required.

The Agency will take reasonable measures to protect nonpublic Applicant information in accordance with applicable law and its privacy practices. The Applicant understands that information may be disclosed when legally required or when otherwise appropriately authorized.

8. NO GUARANTEE OF OPPORTUNITIES OR OUTCOMES
The Applicant acknowledges that the Agency makes no guarantee of acceptance, representation, employment, bookings, auditions, brand partnerships, sponsorships, earnings, audience growth, or other professional outcomes as a result of applying or participating in the evaluation process.

Any potential opportunities, services, and career support will depend on whether representation is subsequently established, the terms of the applicable representation agreement, and the circumstances of the opportunity.

9. GOVERNING LAW
This Agreement shall be governed by and interpreted in accordance with the laws of the State of Michigan, without regard to its conflict-of-law principles, to the extent permitted by applicable law.

10. ACKNOWLEDGMENT & ELECTRONIC SIGNATURE
By electronically signing this Agreement, the Applicant acknowledges that they have read and understood its terms, have had the opportunity to ask questions before signing, and agree to the acknowledgments and permissions described herein.

The Applicant specifically acknowledges that signing this Agreement and submitting an application do not constitute acceptance by Nzinga Management Agency LLC and do not establish a talent representation relationship. A separate formal representation agreement must be offered and executed before representation begins.

The Applicant understands that this Agreement applies to the application and evaluation process and does not replace or amend any separate representation agreement that may subsequently be executed by the parties.`

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
