// One-shot: säkerställer städ-konton (F, Melvin) och admin-lösenord.
// Skapar/uppdaterar auth-användare, tilldelar roller och skapar cleaner_profiles.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Person = {
  email: string;
  password: string;
  role: "cleaner" | "admin";
  profile?: {
    display_name: string;
    full_name?: string;
    personnummer?: string;
    bank_account?: string;
    hourly_rate?: number;
    vacation_pct?: number;
    sort_order?: number;
  };
};

const PEOPLE: Person[] = [
  {
    email: "stadare@goglampingsweden.se",
    password: "topstäd",
    role: "cleaner",
    profile: {
      display_name: "F",
      full_name: "F (Topstäd)",
      hourly_rate: 0,
      vacation_pct: 0,
      sort_order: 10,
    },
  },
  {
    email: "melvin@r8a.se",
    password: "melvinlindstrom",
    role: "cleaner",
    profile: {
      display_name: "Melvin",
      full_name: "Melvin Lindström",
      personnummer: "060522-5176",
      bank_account: "53190334064",
      hourly_rate: 170,
      vacation_pct: 12,
      sort_order: 20,
    },
  },
  {
    email: "info@auroramedia.se",
    password: "Linkoping1234",
    role: "admin",
  },
];

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const result: Array<Record<string, unknown>> = [];

  // Get all users once (paginate)
  const existingByEmail = new Map<string, string>();
  let page = 1;
  while (true) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    for (const u of data.users) if (u.email) existingByEmail.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 200) break;
    page += 1;
    if (page > 20) break;
  }

  for (const person of PEOPLE) {
    let userId = existingByEmail.get(person.email.toLowerCase()) ?? null;
    if (!userId) {
      const created = await admin.auth.admin.createUser({
        email: person.email,
        password: person.password,
        email_confirm: true,
      });
      if (created.error) {
        result.push({ email: person.email, error: created.error.message });
        continue;
      }
      userId = created.data.user?.id ?? null;
    } else {
      await admin.auth.admin.updateUserById(userId, {
        password: person.password,
        email_confirm: true,
      });
    }
    if (!userId) continue;

    await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: person.role }, { onConflict: "user_id,role" });

    if (person.profile) {
      await admin
        .from("cleaner_profiles")
        .upsert(
          {
            user_id: userId,
            email: person.email,
            active: true,
            ...person.profile,
          },
          { onConflict: "user_id" },
        );
    }

    result.push({ email: person.email, user_id: userId, role: person.role });
  }

  return new Response(JSON.stringify({ ok: true, result }), {
    headers: { "content-type": "application/json" },
  });
});
