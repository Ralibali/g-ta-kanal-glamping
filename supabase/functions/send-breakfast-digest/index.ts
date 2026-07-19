import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Disabled: Karin/Bostället ska inte längre få mejl om frukost-/fikaändringar.
// Behåller endpointen som no-op så eventuell cron inte kraschar.
Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  return new Response(
    JSON.stringify({ success: true, disabled: true, reason: 'breakfast digest to Bostället is disabled' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
