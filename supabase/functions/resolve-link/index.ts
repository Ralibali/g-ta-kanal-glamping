import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')?.trim()
  if (!slug || !/^[A-Za-z0-9]{3,16}$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'invalid_slug' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data, error } = await supabase
    .from('short_links')
    .select('id, target_url, clicks')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fire-and-forget click increment
  supabase.from('short_links').update({ clicks: (data.clicks ?? 0) + 1 }).eq('id', data.id).then(() => {})

  return new Response(JSON.stringify({ target_url: data.target_url }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
