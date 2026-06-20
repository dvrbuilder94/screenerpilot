import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const BATCH_DELAY_MS = 150

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = parts[1]
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    return JSON.parse(atob(payload)) as Record<string, unknown>
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // This fans out a real email to every opted-in user, so — unlike the public
  // data collectors — it must only be triggerable by the service role (the
  // pg_cron job, using the vault-stored key), not by any anon/auth caller.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const claims = parseJwtClaims(authHeader.slice('Bearer '.length).trim())
  if (claims?.role !== 'service_role') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const today = new Date().toISOString().split('T')[0]

  const { data: briefing, error: briefingError } = await supabase
    .from('daily_briefings')
    .select('headline, content_md, briefing_date')
    .eq('briefing_date', today)
    .maybeSingle()

  if (briefingError) {
    console.error('Failed to load today\'s briefing', briefingError)
    return new Response(JSON.stringify({ error: 'Failed to load briefing' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!briefing) {
    return new Response(JSON.stringify({ skipped: 'no_briefing_today' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: subscribers, error: subscribersError } = await supabase
    .from('profiles')
    .select('email')
    .eq('email_digest_enabled', true)
    .not('email', 'is', null)

  if (subscribersError) {
    console.error('Failed to load digest subscribers', subscribersError)
    return new Response(JSON.stringify({ error: 'Failed to load subscribers' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const dateLabel = new Date(today + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })

  const templateData = {
    headline: briefing.headline,
    contentMd: briefing.content_md,
    dateLabel,
  }

  const recipients = (subscribers ?? [])
    .map((s) => s.email)
    .filter((e): e is string => Boolean(e))

  let queued = 0
  let failed = 0

  for (let i = 0; i < recipients.length; i++) {
    const email = recipients[i]
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          templateName: 'daily-digest',
          recipientEmail: email,
          // Stable per-day key so a re-run of this job (e.g. cron retry) never
          // double-sends the same digest to the same person.
          idempotencyKey: `daily-digest:${today}:${email.toLowerCase()}`,
          templateData,
        }),
      })
      if (!resp.ok) {
        failed++
        console.error('Failed to enqueue digest for recipient', { email, status: resp.status })
      } else {
        queued++
      }
    } catch (err) {
      failed++
      console.error('Error enqueueing digest for recipient', { email, err })
    }

    if (i < recipients.length - 1) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  return new Response(
    JSON.stringify({ briefing_date: today, recipients: recipients.length, queued, failed }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
