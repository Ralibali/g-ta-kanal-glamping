import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await admin.auth.admin.updateUserById(
    "fb74eee8-416f-43e8-afb5-fecdf164ada5",
    { password: "karin", email_confirm: true }
  );

  return new Response(
    JSON.stringify({ data, error }),
    { headers: { ...corsHeaders, "content-type": "application/json" } }
  );
});
