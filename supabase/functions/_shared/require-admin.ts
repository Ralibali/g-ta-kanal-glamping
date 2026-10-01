import { createClient } from 'npm:@supabase/supabase-js@2';

/** Gateway JWT validation alone also accepts the public anon key. Verify the actual caller before privileged work. */
export async function requireAdminOrService(req: Request, corsHeaders: Record<string, string>): Promise<Response | null> {
  const deny = (status: number, error: string) => new Response(JSON.stringify({ error }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!serviceKey || !url || !anonKey) return deny(503, 'authorization_unavailable');
  const match = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return deny(401, 'Unauthorized');
  const token = match[1];
  if (token === serviceKey) return null;
  try {
    const caller = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error } = await caller.auth.getUser(token);
    if (error || !user || user.is_anonymous) return deny(401, 'Unauthorized');
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: role, error: roleError } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (roleError || !role) return deny(403, 'Forbidden');
    return null;
  } catch { return deny(503, 'authorization_unavailable'); }
}
