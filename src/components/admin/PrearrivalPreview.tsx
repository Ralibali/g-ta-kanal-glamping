import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, Mail, MessageSquare, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type UpcomingBooking = {
  id: string;
  booking_number: string;
  guest_name: string | null;
  guest_first_name: string | null;
  tent_name: string | null;
  checkin_date: string;
  language: string | null;
  phone: string | null;
  email: string | null;
  reminder_5d_sent_at: string | null;
};

type PreviewResult = {
  booking: {
    id: string;
    booking_number: string;
    guest_first_name: string | null;
    tent_name: string;
    checkin_date: string;
    checkout_date: string;
    nights: number;
    email: string | null;
    phone: string | null;
    language: string;
    reminder_5d_sent_at: string | null;
  } | null;
  settings: {
    leadDays: number;
    cutoffDays: number;
    baseUrl: string;
    breakfastPrice: number;
    fikaPrice: number;
    earlyPrice: number;
    latePrice: number;
  };
  available_addons: string[];
  email: { subject: string; html: string; recipient: string | null; error: string | null };
  sms: {
    body: string;
    to: string | null;
    raw_phone: string | null;
    lang: string;
    length: number;
    segments: number;
    skipped_reason: string | null;
  };
};

export function PrearrivalPreview() {
  const [bookings, setBookings] = useState<UpcomingBooking[]>([]);
  const [selectedId, setSelectedId] = useState<string>("__preview__");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);

  const loadUpcoming = async () => {
    setLoadingList(true);
    const today = new Date();
    const from = today.toISOString().slice(0, 10);
    const to = new Date(today.getTime() + 21 * 86400000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("bookings")
      .select("id, booking_number, guest_name, guest_first_name, tent_name, checkin_date, language, phone, email, reminder_5d_sent_at")
      .gte("checkin_date", from)
      .lte("checkin_date", to)
      .order("checkin_date", { ascending: true })
      .limit(60);
    if (error) {
      toast.error("Kunde inte hämta bokningar: " + error.message);
    } else {
      setBookings((data ?? []) as UpcomingBooking[]);
    }
    setLoadingList(false);
  };

  useEffect(() => { loadUpcoming(); }, []);

  const runPreview = async (bookingId?: string) => {
    setLoadingPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke("preview-prearrival", {
        body: bookingId ? { booking_id: bookingId } : {},
      });
      if (error) throw error;
      setPreview(data as PreviewResult);
    } catch (e: any) {
      toast.error("Kunde inte rendera förhandsvisning: " + (e?.message ?? String(e)));
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    const id = selectedId === "__preview__" ? undefined : selectedId;
    runPreview(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const bookingOptions = useMemo(() => bookings.map((b) => {
    const name = b.guest_first_name || b.guest_name || b.booking_number;
    const tent = b.tent_name ?? "?";
    const sent = b.reminder_5d_sent_at ? " ✓" : "";
    return { value: b.id, label: `${b.checkin_date} · ${tent} · ${name}${sent}` };
  }), [bookings]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl">Förankomst – förhandsvisning</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Se exakt hur femdagars-mailet och förankomst-SMS:et ser ut för en specifik bokning innan det skickas.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadUpcoming(); runPreview(selectedId === "__preview__" ? undefined : selectedId); }}>
          <RefreshCw className="mr-2 h-4 w-4" /> Uppdatera
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Välj bokning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder={loadingList ? "Laddar…" : "Välj en kommande bokning"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__preview__">Exempel (syntetisk förhandsvisning)</SelectItem>
              {bookingOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {preview?.booking && (
            <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              <span>Bokning: <strong>{preview.booking.booking_number}</strong></span>
              <span>Språk: <strong>{preview.booking.language}</strong></span>
              <span>{preview.booking.checkin_date} → {preview.booking.checkout_date} ({preview.booking.nights} n)</span>
              {preview.booking.reminder_5d_sent_at && (
                <Badge variant="secondary">SMS redan skickat {new Date(preview.booking.reminder_5d_sent_at).toLocaleString("sv-SE")}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {loadingPreview && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Renderar förhandsvisning…
        </div>
      )}

      {preview && !loadingPreview && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* SMS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>Till: <strong>{preview.sms.to ?? preview.sms.raw_phone ?? "—"}</strong></span>
                <span>Språk: <strong>{preview.sms.lang}</strong></span>
                <span>{preview.sms.length} tecken · {preview.sms.segments} segment</span>
              </div>
              {preview.sms.skipped_reason && (
                <Badge variant={preview.sms.skipped_reason === "preview_only" ? "secondary" : "destructive"}>
                  {preview.sms.skipped_reason === "preview_only"
                    ? "Ingen bokning vald – ingen mottagare"
                    : preview.sms.skipped_reason === "missing_phone"
                      ? "Skippas: telefonnummer saknas"
                      : preview.sms.skipped_reason}
                </Badge>
              )}
              <div className="max-w-sm rounded-2xl bg-muted p-4 whitespace-pre-wrap text-sm leading-relaxed border">
                {preview.sms.body}
              </div>
              <div className="text-xs text-muted-foreground">
                Tillval som erbjuds: {preview.available_addons.length === 0 ? "inga (allt redan bokat)" : preview.available_addons.join(", ")}
              </div>
            </CardContent>
          </Card>

          {/* Email */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" /> E-post
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>Till: <strong>{preview.email.recipient ?? "—"}</strong></span>
                <span>Ämne: <strong>{preview.email.subject || "—"}</strong></span>
              </div>
              {preview.email.error ? (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                  {preview.email.error}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden bg-white">
                  <iframe
                    title="E-post-förhandsvisning"
                    srcDoc={preview.email.html}
                    className="w-full h-[560px] bg-white"
                  />
                </div>
              )}
              {preview.booking?.email && (
                <a
                  href={`mailto:${preview.booking.email}`}
                  className="text-xs text-primary underline underline-offset-4 inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> Öppna mottagaren i e-post
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {preview && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aktuella värden</CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid gap-2 sm:grid-cols-2">
            <div>Utskicksfönster: <strong>{preview.settings.leadDays} dagar</strong></div>
            <div>Sista bokningsdag för tillval: <strong>{preview.settings.cutoffDays} dagar innan ankomst</strong></div>
            <div>Frukost: <strong>{preview.settings.breakfastPrice} kr/pers</strong></div>
            <div>Fikapåse: <strong>{preview.settings.fikaPrice} kr</strong></div>
            <div>Tidig incheckning: <strong>{preview.settings.earlyPrice} kr</strong></div>
            <div>Sen utcheckning: <strong>{preview.settings.latePrice} kr</strong></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PrearrivalPreview;
