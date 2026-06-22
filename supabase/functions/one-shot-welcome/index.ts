import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // Forward as if cleaner invoked notify-tent-ready
  const res = await fetch(`${supabaseUrl}/functions/v1/notify-tent-ready`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tent_id: 'sjobris', cleaning_date: '2026-06-22' }),
  })
  const text = await res.text()
  return new Response(JSON.stringify({ status: res.status, body: text }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
