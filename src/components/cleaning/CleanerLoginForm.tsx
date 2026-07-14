import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseBusiness, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

type Identity = { key: string; label: string; email?: string };

const IDENTITIES: Identity[] = [
  { key: "f", label: "F", email: "stadare@goglampingsweden.se" },
  { key: "melvin", label: "Melvin", email: "melvin@r8a.se" },
  { key: "admin", label: "Admin", email: "info@auroramedia.se" },
  { key: "other", label: "Annan anställd" },
];

export function CleanerLoginForm() {
  const [identityKey, setIdentityKey] = useState(IDENTITIES[0].key);
  const [customEmail, setCustomEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const identity = IDENTITIES.find((option) => option.key === identityKey) ?? IDENTITIES[0];
  const email = identity.email ?? customEmail.trim();

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      toast.error("Fyll i din e-postadress");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      toast.error("Kunde inte logga in. Kontrollera användare och lösenord.");
      return;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BriefcaseBusiness className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Personalportal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Här finns dagens städning, schema, tidrapportering och lön.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={login} className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Vem loggar in?</legend>
              <div className="grid grid-cols-2 gap-2">
                {IDENTITIES.map((option) => (
                  <button
                    type="button"
                    key={option.key}
                    aria-pressed={identityKey === option.key}
                    onClick={() => {
                      setIdentityKey(option.key);
                      setPassword("");
                    }}
                    className={`min-h-16 rounded-xl border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      identityKey === option.key
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border hover:bg-muted/60"
                    }`}
                  >
                    <UserIcon className="h-4 w-4 mx-auto mb-1" aria-hidden="true" />
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {!identity.email && (
              <div className="space-y-1.5">
                <Label htmlFor="staff-email">E-postadress</Label>
                <Input
                  id="staff-email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  value={customEmail}
                  onChange={(event) => setCustomEmail(event.target.value)}
                  placeholder="namn@exempel.se"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="staff-password">Lösenord</Label>
              <Input
                id="staff-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus={Boolean(identity.email)}
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={busy || !email || !password}>
              {busy ? "Loggar in…" : "Öppna personalportalen"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Problem att logga in? Kontakta Christoffer så återställer vi lösenordet.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
