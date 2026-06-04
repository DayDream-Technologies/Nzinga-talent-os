import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { authenticateRequest, corsHeaders, jsonResponse, errorResponse } from '../shared/auth.ts'

interface SendEmailRequest {
  to_email: string
  to_name: string
  subject: string
  template_id?: number
  template_vars?: Record<string, string>
  html_body?: string
  text_body?: string
}

serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, origin)
  }

  const user = await authenticateRequest(req)
  if (!user) {
    return errorResponse('Unauthorized', 401, origin)
  }

  const apiKey = Deno.env.get('MJ_APIKEY_PUBLIC')
  const secretKey = Deno.env.get('MJ_APIKEY_PRIVATE')
  const senderEmail = Deno.env.get('MJ_SENDER_EMAIL')
  const senderName = Deno.env.get('MJ_SENDER_NAME') || 'Nzinga Talent Group'

  if (!apiKey || !secretKey || !senderEmail) {
    return errorResponse('Mailjet is not configured', 503, origin)
  }

  let body: SendEmailRequest
  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400, origin)
  }

  const { to_email, to_name, subject, template_id, template_vars, html_body, text_body } = body

  if (!to_email || !subject) {
    return errorResponse('to_email and subject are required', 400, origin)
  }

  const message: Record<string, unknown> = {
    From: { Email: senderEmail, Name: senderName },
    To: [{ Email: to_email, Name: to_name || to_email }],
    Subject: subject,
  }

  if (template_id) {
    message.TemplateID = template_id
    message.TemplateLanguage = true
    if (template_vars) {
      message.Variables = template_vars
    }
  } else if (html_body) {
    message.HTMLPart = html_body
    if (text_body) message.TextPart = text_body
  } else if (text_body) {
    message.TextPart = text_body
  } else {
    return errorResponse('Provide template_id, html_body, or text_body', 400, origin)
  }

  const credentials = btoa(`${apiKey}:${secretKey}`)

  try {
    const res = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({ Messages: [message] }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Mailjet error:', res.status, errBody)
      return errorResponse('Email delivery failed', 502, origin)
    }

    const result = await res.json()
    return jsonResponse({ status: 'sent', mailjet_response: result }, 200, origin)
  } catch (err) {
    console.error('Mailjet request failed:', err)
    return errorResponse('Email service unavailable', 503, origin)
  }
})
