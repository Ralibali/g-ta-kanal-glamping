// One-shot: skapa delat frukost-konto (Karin@bostallet.se / karin) med rollen breakfast.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const BREAKFAST_EMAIL = "karin@bostallet.se";
const BREAKFAST_PASSWORD = "Karin1";

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
    let page = 1;
    while (true) {
      const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (!list?.users.length) break;
      const existing = list.users.find((u) => u.email === BREAKFAST_EMAIL);
      if (existing) {
        userId = existing.id;
        await admin.auth.admin.updateUserById(existing.id, { password: BREAKFAST_PASSWORD, email_confirm: true });
        break;
      }
      page++;
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
