import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  // Owner inbox — kept server-side, never exposed to the client. Set via the
  // CONTACT_RECIPIENT_EMAIL secret in the Supabase dashboard.
  const ownerEmail = Deno.env.get('CONTACT_RECIPIENT_EMAIL')

  if (!supabaseUrl || !serviceKey || !ownerEmail) return json({ error: 'Server config error' }, 500)

  let name = ''
  let email = ''
  let message = ''
  try {
    const body = await req.json()
    name = String(body?.name ?? '').trim().slice(0, 100)
    email = String(body?.email ?? '').trim().slice(0, 255)
    message = String(body?.message ?? '').trim().slice(0, 2000)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailOk) return json({ error: 'Invalid email' }, 400)
  if (message.length < 5) return json({ error: 'Message too short' }, 400)

  const supabase = createClient(supabaseUrl, serviceKey)

  const idempotencyKey = `contact-${crypto.randomUUID()}`
  const { data, error } = await supabase.functions.invoke('send-transactional-email', {
    body: {
      templateName: 'contact-notify',
      recipientEmail: ownerEmail,
      idempotencyKey,
      templateData: { fromName: name, fromEmail: email, message },
    },
  })

  if (error) {
    console.error('send-transactional-email failed', error)
    return json({ error: 'Failed to send' }, 500)
  }

  return json({ success: true, data })
})
