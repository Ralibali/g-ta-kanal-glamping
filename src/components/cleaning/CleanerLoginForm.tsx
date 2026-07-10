import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

type Identity = { key: string; label: string; email: string };

const IDENTITIES: Identity[] = [
  { key: "f", label: "F (Topstäd)", email: "stadare@goglampingsweden.se" },
  { key: "melvin", label: "Melvin", email: "melvin@r8a.se" },
  { key: "admin", label: "Admin (Christoffer)", email: "info@auroramedia.se" },
];

export function CleanerLoginForm() {
  const [identity, setIdentity] = useState<Identity>(IDENTITIES[0]);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: identity.email,
      password,
    });
    setBusy(false);
    if (error) toast.error("Fel lösenord");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Sparkles className="h-8 w-8 mx-auto text-primary" />
          <CardTitle>Städ – logga in</CardTitle>
          <p className="text-sm text-muted-foreground">Välj vem du är och skriv ditt lösenord.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={login} className="space-y-4">
            <div className="space-y-2">
              <Label>Vem är du?</Label>
              <div className="grid grid-cols-3 gap-2">
                {IDENTITIES.map((option) => (
                  <button
                    type="button"
                    key={option.key}
                    onClick={() => setIdentity(option)}
                    className={`rounded-lg border p-2 text-xs font-medium transition ${identity.key === option.key ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted/50"}`}
                  >
                    <UserIcon className="h-4 w-4 mx-auto mb-1" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Lösenord</Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Loggar in…" : "Logga in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
