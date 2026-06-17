// One-shot: skapa delat frukost-konto (frukost@goglampingsweden.se / karin) med rollen breakfast.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const BREAKFAST_EMAIL = "frukost@goglampingsweden.se";
const BREAKFAST_PASSWORD = "karin";

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let userId: string | null = null;
  const created = await admin.auth.admin.createUser({
    email: BREAKFAST_EMAIL,
    password: BREAKFAST_PASSWORD,
    email_confirm: true,
  });
  if (created.data.user) {
    userId = created.data.user.id;
  } else {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list.users.find((u) => u.email === BREAKFAST_EMAIL);
    if (existing) {
      userId = existing.id;
      await admin.auth.admin.updateUserById(existing.id, { password: BREAKFAST_PASSWORD, email_confirm: true });
    }
  }
  if (!userId) {
    return new Response(JSON.stringify({ ok: false, error: created.error?.message ?? "unknown" }), { status: 500 });
  }

  await admin.from("user_roles").upsert({ user_id: userId, role: "breakfast" as any }, { onConflict: "user_id,role" });

  return new Response(JSON.stringify({ ok: true, user_id: userId }), {
    headers: { "content-type": "application/json" },
  });
});
