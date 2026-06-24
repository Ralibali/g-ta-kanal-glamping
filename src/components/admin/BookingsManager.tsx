import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

interface AddonBadge {
  slug: string;
  label: string;
  status: string;
  source: "order" | "stay";
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

const SUPPORTED_LANGS = ["sv", "da", "en", "no", "de", "nl"];

const ORDER_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  confirmed: "default",
  requested: "secondary",
  pending: "secondary",
  cancelled: "destructive",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  paid: "betald",
  confirmed: "bekräftad",
  requested: "önskemål",
  pending: "avvaktar",
  cancelled: "avbokad",
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
    const lang = SUPPORTED_LANGS.includes(langRaw) ? langRaw : "sv";

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

// ─── Sirvoy "booking content" → tent_stays ─────────────────────────────
const ROOM_TO_TENT_LOCAL: Record<string, string> = { "1": "sjobris", "2": "naturkarnan", "3": "lugnetsyta" };

// Detect dietary needs from free-text fields (Sirvoy notes, guest comments, extras)
const DIETARY_PATTERNS: { id: string; re: RegExp }[] = [
  { id: "gluten_free", re: /\b(glutenfri|gluten\s*fri|gluten[-\s]?free|coeliac|celiaki)\b/i },
  { id: "vegan", re: /\b(vegan|veganskt|veganisch|vegano)\b/i },
  { id: "vegetarian", re: /\b(vegetar|vegetariskt|veggie)\b/i },
  { id: "lactose_free", re: /\b(laktosfri|laktos\s*fri|lactose[-\s]?free|mjölkfri|mjolkfri|dairy[-\s]?free)\b/i },
  { id: "nut_allergy", re: /\b(nötallergi|notallergi|nut\s*allergy|nötter|peanut|jordnöt|hassel|cashew|mandel)\b/i },
];

function parseDietaryFromText(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const { id, re } of DIETARY_PATTERNS) if (re.test(text)) found.push(id);
  return found;
}

type TentStayRow = {
  booking_number: string;
  room_id: string | null;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  adults: number;
  children: number;
  breakfast: boolean;
  fikapase: boolean;
  late_checkout: boolean;
  guest_name: string | null;
  phone: string | null;
  email: string | null;
  lang: string;
  note: string | null;
  dietary: string[];
  dietary_note: string | null;
  raw: Record<string, unknown>;
};

function buildTentStays(rawRows: Record<string, string>[]): TentStayRow[] {
  // Normalize headers per row
  const lookups = rawRows.map((row) => {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) o[normaliseHeader(k)] = (v ?? "").toString().trim();
    return o;
  });
  const get = (l: Record<string, string>, ...keys: string[]) => {
    for (const k of keys) { const v = l[normaliseHeader(k)]; if (v) return v; }
    return "";
  };

  // 1) Aggregate EXTRAS per booking number
  const extras = new Map<string, { children: number; breakfast: boolean; fikapase: boolean; late_checkout: boolean }>();
  for (const l of lookups) {
    const type = get(l, "type", "typ").toUpperCase();
    if (type !== "EXTRAS") continue;
    const bn = get(l, "booking no.", "booking no", "bokningsnummer").toUpperCase();
    if (!bn) continue;
    const spec = get(l, "specification", "kategori").toLowerCase();
    const units = parseInt(get(l, "units"), 10);
    const e = extras.get(bn) ?? { children: 0, breakfast: false, fikapase: false, late_checkout: false };
    if (spec.includes("barn")) e.children += isNaN(units) ? 1 : units;
    if (spec.includes("frukost")) e.breakfast = true;
    if (spec.includes("fikapåse") || spec.includes("fikapase")) e.fikapase = true;
    if (spec.includes("sen utcheck")) e.late_checkout = true;
    extras.set(bn, e);
  }

  // 2) One stay per ACCOMM row
  const stays: TentStayRow[] = [];
  for (let i = 0; i < lookups.length; i++) {
    const l = lookups[i];
    const type = get(l, "type", "typ").toUpperCase();
    if (type !== "ACCOMM") continue;
    const bn = get(l, "booking no.", "booking no", "bokningsnummer").toUpperCase();
    if (!bn) continue;
    const roomId = get(l, "room id", "room") || null;
    let tentId = roomId ? ROOM_TO_TENT_LOCAL[roomId] : null;
    if (!tentId) tentId = detectTent(get(l, "specification", "tält", "tent", "room")) ?? "";
    if (!tentId) continue;
    const ci = parseDate(get(l, "check-in", "checkin", "incheckning"));
    const co = parseDate(get(l, "check-out", "checkout", "utcheckning"));
    if (!ci || !co) continue;
    const adults = parseInt(get(l, "guests"), 10) || 0;
    const e = extras.get(bn) ?? { children: 0, breakfast: false, fikapase: false, late_checkout: false };
    const first = get(l, "first name", "förnamn");
    const last = get(l, "last name", "efternamn");
    const combined = get(l, "guest name", "namn");
    const guest = combined || [first, last].filter(Boolean).join(" ") || null;
    const langRaw = get(l, "language", "språk", "lang").toLowerCase().slice(0, 2);
    const lang = SUPPORTED_LANGS.includes(langRaw) ? langRaw : "sv";
    stays.push({
      booking_number: bn,
      room_id: roomId,
      tent_id: tentId,
      checkin_date: ci,
      checkout_date: co,
      adults,
      children: e.children,
      breakfast: e.breakfast,
      fikapase: e.fikapase,
      late_checkout: e.late_checkout,
      guest_name: guest,
      phone: get(l, "phone", "telefon") || null,
      email: get(l, "email", "e-post", "epost") || null,
      lang,
      note: get(l, "internal note", "note") || null,
      raw: rawRows[i],
    });
  }
  return stays;
}

interface MissingContact {
  id: string; booking_number: string; guest_name: string | null;
  tent_id: string | null; checkin_date: string;
  has_email: boolean; has_phone: boolean;
}

export function BookingsManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [missing, setMissing] = useState<MissingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [addonFilter, setAddonFilter] = useState<"all" | "with" | "without">("all");
  const [bookingAddons, setBookingAddons] = useState<Record<string, AddonBadge[]>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const [bRes, mRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .order("checkin_date", { ascending: false, nullsFirst: false })
        .limit(500),
      (supabase as any).rpc("list_bookings_missing_contact", { p_window_days: 30 }),
    ]);
    if (bRes.error) toast.error("Kunde inte ladda bokningar: " + bRes.error.message);
    const rows = (bRes.data as Booking[]) ?? [];
    setBookings(rows);
    setMissing(((mRes.data as MissingContact[]) ?? []));

    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const bookingNumbers = rows.map((r) => r.booking_number);
      const [ordersRes, staysRes] = await Promise.all([
        (supabase as any)
          .from("addon_orders")
          .select("booking_id, quantity, status, addons:addon_id(slug, name_sv)")
          .in("booking_id", ids)
          .limit(2000),
        (supabase as any)
          .from("tent_stays")
          .select("booking_number, breakfast, fikapase, late_checkout")
          .in("booking_number", bookingNumbers),
      ]);

      const map: Record<string, AddonBadge[]> = {};
      const orderRows = (ordersRes.data ?? []) as any[];
      const stayRows = (staysRes.data ?? []) as any[];
      const byNumber = new Map(rows.map((r) => [r.booking_number, r.id]));

      for (const o of orderRows) {
        const bid = o.booking_id as string;
        if (!bid) continue;
        if (!map[bid]) map[bid] = [];
        const slug = o.addons?.slug as string;
        const label = o.addons?.name_sv as string;
        if (!slug || !label) continue;
        if (map[bid].some((x) => x.slug === slug && x.source === "order")) continue;
        map[bid].push({ slug, label, status: o.status, source: "order" });
      }

      const stayMap = new Map<string, { breakfast: boolean; fikapase: boolean; late_checkout: boolean }>();
      for (const s of stayRows) {
        const bn = s.booking_number as string;
        const existing = stayMap.get(bn);
        if (!existing) {
          stayMap.set(bn, {
            breakfast: !!s.breakfast,
            fikapase: !!s.fikapase,
            late_checkout: !!s.late_checkout,
          });
        } else {
          existing.breakfast ||= !!s.breakfast;
          existing.fikapase ||= !!s.fikapase;
          existing.late_checkout ||= !!s.late_checkout;
        }
      }

      for (const [bn, flags] of stayMap.entries()) {
        const bid = byNumber.get(bn);
        if (!bid) continue;
        if (!map[bid]) map[bid] = [];
        if (flags.breakfast && !map[bid].some((x) => x.slug === "breakfast")) {
          map[bid].push({ slug: "breakfast", label: "Frukost", status: "confirmed", source: "stay" });
        }
        if (flags.fikapase && !map[bid].some((x) => x.slug === "fika_bag")) {
          map[bid].push({ slug: "fika_bag", label: "Fikapåse", status: "confirmed", source: "stay" });
        }
        if (flags.late_checkout && !map[bid].some((x) => x.slug === "late_checkout")) {
          map[bid].push({ slug: "late_checkout", label: "Sen utcheckning", status: "confirmed", source: "stay" });
        }
      }

      setBookingAddons(map);
    } else {
      setBookingAddons({});
    }

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
        const headers = (results.meta.fields ?? []).map((h) => h.toLowerCase());
        const hasType = headers.some((h) => h === "type" || h === "typ");
        const hasPhoneCol = headers.some((h) => h.includes("phone") || h.includes("telefon"));

        // ─── Basic info CSV: enrich phone/email only ────────────────
        if (!hasType && hasPhoneCol) {
          const updates = results.data
            .map((row) => {
              const lookup: Record<string, string> = {};
              for (const [k, v] of Object.entries(row)) {
                lookup[normaliseHeader(k)] = (v ?? "").toString().trim();
              }
              const pick = (...keys: string[]) => {
                for (const k of keys) { const v = lookup[normaliseHeader(k)]; if (v) return v; }
                return "";
              };
              const bn = pick("booking no.", "booking no", "bokningsnummer").toUpperCase();
              if (!bn) return null;
              let phone = pick("phone", "telefon", "mobile", "mobil");
              // Sirvoy prefixes phone with a leading apostrophe
              if (phone.startsWith("'")) phone = phone.slice(1);
              const email = pick("email", "e-post", "epost", "mail");
              if (!phone && !email) return null;
              return { booking_number: bn, phone: phone || null, email: email || null };
            })
            .filter((x): x is { booking_number: string; phone: string | null; email: string | null } => !!x);

          if (updates.length === 0) {
            toast.error("Hittade inga bokningsnummer eller kontaktuppgifter i filen.");
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
            return;
          }

          let okBookings = 0, okStays = 0;
          for (const u of updates) {
            const patch: Record<string, string> = {};
            if (u.phone) patch.phone = u.phone;
            if (u.email) patch.email = u.email;
            const { error: e1 } = await supabase.from("bookings").update(patch as never).eq("booking_number", u.booking_number);
            if (!e1) okBookings++;
            const { error: e2 } = await (supabase as any).from("tent_stays").update(patch).eq("booking_number", u.booking_number);
            if (!e2) okStays++;
          }
          toast.success(`Kontaktuppgifter uppdaterade på ${okBookings} bokningar och ${okStays} tältvistelser.`);
          await load();
          setUploading(false);
          if (fileRef.current) fileRef.current.value = "";
          return;
        }

        // ─── Booking content CSV: full import ──────────────────────
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
              // Re-apply addon-orders flags so online bookings aren't wiped by CSV re-import
              try {
                const { buildAddonFlagsByStay } = await import("@/lib/stay-sync");
                const bookingNumbers = Array.from(new Set(stays.map((s: any) => s.booking_number)));
                if (bookingNumbers.length > 0) {
                  const { data: bks } = await (supabase as any)
                    .from("bookings")
                    .select("id, booking_number, tent_id")
                    .in("booking_number", bookingNumbers);
                  const { data: ords } = await (supabase as any)
                    .from("addon_orders")
                    .select("booking_id, status, addons:addon_id(slug)")
                    .in("status", ["paid", "confirmed", "requested"]);
                  const flagsByStay = buildAddonFlagsByStay(ords ?? [], bks ?? []);
                  for (const [key, patch] of flagsByStay.entries()) {
                    const [bn, tid] = key.split("|");
                    await (supabase as any).from("tent_stays").update(patch).eq("booking_number", bn).eq("tent_id", tid);
                  }
                }
              } catch (err) { console.error("addon re-sync failed", err); }

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
          toast.success(`${rows.length} bokningar uppladdade.${staysMsg} Tips: ladda nu upp "Basic info"-CSV för telefon/e-post.`);
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

  const filtered = useMemo(() => {
    let list = bookings;
    if (addonFilter === "with") list = list.filter((b) => (bookingAddons[b.id]?.length ?? 0) > 0);
    if (addonFilter === "without") list = list.filter((b) => (bookingAddons[b.id]?.length ?? 0) === 0);
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((b) => {
      return (
        b.booking_number.toLowerCase().includes(q) ||
        (b.guest_name?.toLowerCase().includes(q) ?? false) ||
        (b.email?.toLowerCase().includes(q) ?? false) ||
        (b.phone?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [bookings, addonFilter, bookingAddons, search]);

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
            Ladda upp <strong>"Booking content"</strong>-CSV för bokningar och städschema. Ladda sedan upp <strong>"Basic info"</strong>-CSV för att fylla i telefon och e-post (krävs för SMS/mail till gäst). Båda filerna känns igen automatiskt.
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

      {missing.length > 0 && (
        <Card className="border-amber-500/60 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              ⚠️ Saknar kontaktuppgifter ({missing.length})
            </CardTitle>
            <CardDescription>
              Dessa bokningar checkar in inom 30 dagar men saknar mejl och/eller telefon — automationen hoppar över dem. Ladda upp "Basic info"-CSV eller fyll i manuellt i Sirvoy och importera igen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Boknings#</TableHead>
                    <TableHead>Gäst</TableHead>
                    <TableHead>Tält</TableHead>
                    <TableHead>Incheckning</TableHead>
                    <TableHead>Saknar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missing.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono">{m.booking_number}</TableCell>
                      <TableCell>{m.guest_name ?? "—"}</TableCell>
                      <TableCell>{m.tent_id ? <Badge variant="secondary">{m.tent_id}</Badge> : "—"}</TableCell>
                      <TableCell>{m.checkin_date}</TableCell>
                      <TableCell>
                        {!m.has_email && <Badge variant="destructive" className="mr-1">mejl</Badge>}
                        {!m.has_phone && <Badge variant="destructive">telefon</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Alla bokningar ({filtered.length})
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök bokningsnummer, namn eller e-post..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={addonFilter} onValueChange={(v) => setAddonFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla bokningar</SelectItem>
                <SelectItem value="with">Med tillval</SelectItem>
                <SelectItem value="without">Utan tillval</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableHead>Tillval</TableHead>
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
                        {bookingAddons[b.id]?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {bookingAddons[b.id].map((a, i) => {
                              const variant = ORDER_STATUS_VARIANT[a.status] ?? "outline";
                              const label = ORDER_STATUS_LABEL[a.status] ?? a.status;
                              return (
                                <Badge
                                  key={i}
                                  variant={variant}
                                  title={a.source === "order" ? "Beställning" : "Importerat tillval"}
                                >
                                  {a.label}
                                  {label !== a.status && <span className="ml-1 opacity-70">({label})</span>}
                                </Badge>
                              );
                            })}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
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
