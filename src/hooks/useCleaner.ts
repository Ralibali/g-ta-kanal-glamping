import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type CleanerProfile = {
  user_id: string;
  display_name: string;
  hourly_rate: number;
  vacation_pct: number;
};

export function useCleaner() {
  const [user, setUser] = useState<User | null>(null);
  const [isCleaner, setIsCleaner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<CleanerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async (u: User | null) => {
      if (!u) {
        setIsCleaner(false);
        setIsAdmin(false);
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id);
      const roles = (data ?? []).map((r: { role: string }) => r.role);
      setIsCleaner(roles.includes("cleaner") || roles.includes("admin"));
      setIsAdmin(roles.includes("admin"));

      const { data: p } = await (supabase as any)
        .from("cleaner_profiles")
        .select("user_id, display_name, hourly_rate, vacation_pct")
        .eq("user_id", u.id)
        .maybeSingle();
      setProfile(p ?? null);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      check(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      check(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsCleaner(false);
    setIsAdmin(false);
    setProfile(null);
  };

  return { user, isCleaner, isAdmin, profile, loading, signOut };
}
