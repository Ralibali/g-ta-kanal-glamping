import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, RefreshCw, Trash2, Search, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: string;
  booking_number: string;
  guest_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
  tent_id: string | null;
  amount: number | null;
  lang: string | null;
  raw: Record<string, unknown> | null;
  created_at: string;
}

// Mappar olika möjliga rubriker → vårt fält
const FIELD_ALIASES: Record<string, string[]> = {
  booking_number: ["bokningsnummer", "bokning", "booking", "booking number", "booking no", "boknings-id", "boknings id"],
  guest_name: ["namn", "gäst", "guest", "guest name", "name", "kund"],
  first_name: ["first name", "förnamn", "fornamn"],
  last_name: ["last name", "efternamn"],
  email: ["e-post", "epost", "email", "e-mail", "mail"],
  phone: ["telefon", "telefonnummer", "phone", "mobile", "mobil"],
  address: ["adress", "address"],
  checkin_date: ["incheckning", "ankomst", "check-in", "checkin", "arrival", "from", "check in"],
  checkout_date: ["utcheckning", "avresa", "check-out", "checkout", "departure", "to", "check out"],
  tent_id: ["tält", "rum", "tent", "room", "boende", "kategori", "specification"],
  amount: ["belopp", "summa", "totalt", "amount", "total", "price", "pris"],
  lang: ["språk", "language", "lang"],
  type: ["type", "typ"],
};

function normaliseHeader(h: string) {
  return h.toLowerCase().trim().replace(/[_\-.]/g, " ").replace(/\s+/g, " ");
}

function detectTent(s: string): string | null {
  const t = s.toLowerCase();
  if (!t) return null;
  if (t.includes("sjö") || t.includes("sjo") || t.includes("bris")) return "sjobris";
  if (t.includes("natur") || t.includes("kärn") || t.includes("karn")) return "naturkarnan";
  if (t.includes("lugn")) return "lugnetsyta";
  return null;
}

function parseDate(s: string) {
  if (!s) return null;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

type MappedBooking = {
  booking_number: string;
  guest_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
  tent_id: string | null;
  amount: number | null;
  lang: string;
  raw: Record<string, unknown>;
};

function aggregateRows(rawRows: Record<string, string>[]): MappedBooking[] {
  const grouped = new Map<string, MappedBooking>();

  for (const row of rawRows) {
    const lookup: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      lookup[normaliseHeader(k)] = (v ?? "").toString().trim();
    }
    const pick = (field: keyof typeof FIELD_ALIASES) => {
      for (const alias of FIELD_ALIASES[field]) {
        const val = lookup[alias];
        if (val) return val;
      }
      return "";
    };

    const booking_number = pick("booking_number").toUpperCase();
    if (!booking_number) continue;

    const type = pick("type").toUpperCase();
    // Hoppa över betalningsrader – negativa belopp, inget gästnamn
    if (type === "PAYMENT") continue;

    const first = pick("first_name");
    const last = pick("last_name");
    const combined = pick("guest_name");
    const guest_name = combined || [first, last].filter(Boolean).join(" ") || null;

    const tent_id = detectTent(pick("tent_id"));

    const amountRaw = pick("amount").replace(/\s/g, "").replace(",", ".").replace(/[^\d.\-]/g, "");
    const amountNum = amountRaw ? Number(amountRaw) : NaN;
    const amount = !isNaN(amountNum) ? amountNum : null;

    const langRaw = pick("lang").toLowerCase().slice(0, 2);
    const lang = ["sv", "da", "en", "no", "de"].includes(langRaw) ? langRaw : "sv";

    const existing = grouped.get(booking_number);
    if (!existing) {
      grouped.set(booking_number, {
        booking_number,
        guest_name,
        email: pick("email") || null,
        phone: pick("phone") || null,
        address: pick("address") || null,
        checkin_date: parseDate(pick("checkin_date")),
        checkout_date: parseDate(pick("checkout_date")),
        tent_id,
        amount: amount && amount > 0 ? amount : null,
        lang,
        raw: { rows: [row] },
      });
    } else {
      if (!existing.guest_name && guest_name) existing.guest_name = guest_name;
      if (!existing.tent_id && tent_id) existing.tent_id = tent_id;
      if (!existing.email && pick("email")) existing.email = pick("email");
      if (!existing.phone && pick("phone")) existing.phone = pick("phone");
      if (!existing.address && pick("address")) existing.address = pick("address");
      if (amount && amount > 0) existing.amount = (existing.amount ?? 0) + amount;
      const prev = (existing.raw.rows as unknown[]) ?? [];
      existing.raw = { rows: [...prev, row] };
    }
  }

  return Array.from(grouped.values());
}

export function BookingsManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("checkin_date", { ascending: false, nullsFirst: false })
      .limit(500);
    if (error) toast.error("Kunde inte ladda bokningar: " + error.message);
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleFile = (file: File) => {
    setUploading(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = aggregateRows(results.data);
        if (rows.length === 0) {
          toast.error("Hittade inga giltiga rader. Saknas kolumnen för bokningsnummer?");
          setUploading(false);
          return;
        }
        const { error } = await supabase
          .from("bookings")
          .upsert(rows as never, { onConflict: "booking_number" });
        if (error) {
          toast.error("Uppladdning misslyckades: " + error.message);
        } else {
          // Build tent_stays from the same file (Sirvoy "booking content" format)
          const stays = buildTentStays(results.data);
          let staysMsg = "";
          if (stays.length > 0) {
            const today = new Date().toISOString().slice(0, 10);
            await (supabase as any).from("tent_stays").delete().gte("checkout_date", today);
            const { error: stayErr } = await (supabase as any)
              .from("tent_stays")
              .upsert(stays, { onConflict: "booking_number,room_id,checkin_date" });
            if (stayErr) staysMsg = ` Städschema-fel: ${stayErr.message}`;
            else {
              const datesWithTurnover = new Set<string>();
              const byDate = new Map<string, Set<string>>();
              stays.forEach((s) => {
                byDate.set(s.checkin_date, (byDate.get(s.checkin_date) ?? new Set()).add(`in:${s.tent_id}`));
                byDate.set(s.checkout_date, (byDate.get(s.checkout_date) ?? new Set()).add(`out:${s.tent_id}`));
              });
              byDate.forEach((set, d) => {
                const tents = new Set<string>();
                set.forEach((x) => { const [, t] = x.split(":"); if ([...set].some((y) => y.startsWith("in:") && y.endsWith(t)) && [...set].some((y) => y.startsWith("out:") && y.endsWith(t))) tents.add(t); });
                if (tents.size > 0) datesWithTurnover.add(d);
              });
              staysMsg = ` • ${stays.length} tältvistelser, ${datesWithTurnover.size} datum med växling.`;
            }
          }
          toast.success(`${rows.length} bokningar uppladdade.${staysMsg}`);
          await load();
        }
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      },
      error: (err) => {
        toast.error("CSV-fel: " + err.message);
        setUploading(false);
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ta bort denna bokning?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Borttagen");
      load();
    }
  };

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.booking_number.toLowerCase().includes(q) ||
      (b.guest_name?.toLowerCase().includes(q) ?? false) ||
      (b.email?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Bokningar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ladda upp CSV från Sirvoy. Gäster kan sen checka in med sitt bokningsnummer.
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Uppdatera
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Ladda upp CSV
          </CardTitle>
          <CardDescription>
            Befintliga bokningar (samma bokningsnummer) skrivs över. Igenkända kolumner:
            bokningsnummer, namn, e-post, telefon, adress, incheckning, utcheckning, tält, belopp, språk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {uploading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Bearbetar...
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Alla bokningar ({bookings.length})
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök bokningsnummer, namn eller e-post..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Laddar...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">Inga bokningar.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Boknings#</TableHead>
                    <TableHead>Gäst</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead>Incheckning</TableHead>
                    <TableHead>Utcheckning</TableHead>
                    <TableHead>Tält</TableHead>
                    <TableHead>Belopp</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono">{b.booking_number}</TableCell>
                      <TableCell>{b.guest_name ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.email && <div>{b.email}</div>}
                        {b.phone && <div>{b.phone}</div>}
                      </TableCell>
                      <TableCell>{b.checkin_date ?? "—"}</TableCell>
                      <TableCell>{b.checkout_date ?? "—"}</TableCell>
                      <TableCell>
                        {b.tent_id ? <Badge variant="secondary">{b.tent_id}</Badge> : "—"}
                      </TableCell>
                      <TableCell>{b.amount ? `${b.amount} kr` : "—"}</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(b.id)}
                          aria-label="Ta bort"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
