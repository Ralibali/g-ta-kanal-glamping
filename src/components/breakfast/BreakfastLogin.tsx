import { useState } from "react";
import { Coffee, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BREAKFAST_EMAIL = "karin@bostallet.se";

export function BreakfastLogin() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: BREAKFAST_EMAIL, password });
    setBusy(false);
    if (error) toast.error("Fel lösenord eller inloggning.");
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Coffee className="mx-auto h-8 w-8 text-primary" />
          <CardTitle>Frukostleverans</CardTitle>
          <p className="text-sm text-muted-foreground">Lösenord: <strong>Bostället</strong></p>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={login}>
            <div className="space-y-2">
              <Label>Lösenord</Label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required />
            </div>
            <Button className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Logga in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
