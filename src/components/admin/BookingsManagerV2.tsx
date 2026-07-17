import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { FileCheck2, FileSpreadsheet, Loader2, RefreshCw, Search, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  detectSirvoyFile,
  mergeDietaryIntoStays,
  parseBasicInfo,
  parseBookingContent,
  type CsvRow,
  type ParsedBooking,
  type SavedDietary,
  type SirvoyFileKind,
} from "@/lib/sirvoy-import";

type BookingRow = {
  id: string;
  booking_number: string;
  guest_name: string | null;
  email: string | null;
  phone: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
  lang: string | null;
};

type StaySummary = {
  tents: string[];
  guests: number;
  breakfast: number;
  fika: number;
};

type ParsedFile = {
  name: string;
  kind: SirvoyFileKind;
  rows: CsvRow[];
};

type ImportLog = {
  file: string;
  kind: Exclude<SirvoyFileKind, "unknown">;
  message: string;
};

const TENT_LABELS: Record<string, string> = {
  sjobris: "Tält 1",
  naturkarnan: "Tält 2",
  lugnetsyta: "Tält 3",
};

function parseFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
      complete: (result) => {
        if (result.errors.some((error) => error.type === "Quotes")) {
          reject(new Error(`${file.name}: CSV-filen innehåller felaktiga citattecken.`));
          return;
        }
        resolve({
          name: file.name,
          kind: detectSirvoyFile(result.meta.fields ?? []),
          rows: result.data,
        });
      },
      error: (error) => reject(error),
    });
  });
}

function toDatabaseBooking(booking: ParsedBooking) {
  return {
    booking_number: booking.booking_number,
    sirvoy_booking_no: booking.sirvoy_booking_no ?? booking.booking_number,
    guest_name: booking.guest_name ?? null,
    guest_first_name: booking.guest_first_name ?? null,
    email: booking.email ?? null,
    phone: booking.phone ?? null,
    address: booking.address ?? null,
    country_code: booking.country_code ?? null,
    checkin_date: booking.checkin_date ?? null,
    checkout_date: booking.checkout_date ?? null,
    tent_id: booking.tent_id ?? null,
    tent_name: booking.tent_name ?? null,
    amount: booking.amount ?? null,
    lang: booking.lang ?? "sv",
    language: booking.language ?? booking.lang ?? "sv",
    nights: booking.nights ?? null,
    raw: booking.raw ?? null,
    updated_at: new Date().toISOString(),
  };
}

async function runInBatches<T>(items: T[], worker: (item: T) => Promise<void>, size = 12) {
  for (let index = 0; index < items.length; index += size) {
    await Promise.all(items.slice(index, index + size).map(worker));
  }
}

export function BookingsManagerV2() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [summaries, setSummaries] = useState<Record<string, StaySummary>>({});
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<ImportLog[]>([]);

  const load = async () => {
    setLoading(true);
    const { data: bookingRows, error } = await (supabase as any)
      .from("bookings")
      .select("id, booking_number, guest_name, email, phone, checkin_date, checkout_date, lang")
      .order("checkin_date", { ascending: true, nullsFirst: false })
      .limit(1000);

    if (error) {
      toast.error(`Kunde inte ladda bokningar: ${error.message}`);
      setLoading(false);
      return;
    }

    const rows = (bookingRows ?? []) as BookingRow[];
    setBookings(rows);
    const bookingNumbers = rows.map((row) => row.booking_number);
    const next: Record<string, StaySummary> = {};

    if (bookingNumbers.length > 0) {
      const { data: stayRows } = await (supabase as any)
        .from("tent_stays")
        .select("booking_number, tent_id, guests, breakfast_csv_quantity, breakfast_addon_quantity, fikapase_csv_quantity, fikapase_addon_quantity")
        .in("booking_number", bookingNumbers);

      for (const stay of stayRows ?? []) {
        const bookingNumber = String(stay.booking_number);
        const summary = next[bookingNumber] ?? { tents: [], guests: 0, breakfast: 0, fika: 0 };
        const tentId = String(stay.tent_id ?? "");
        if (tentId && !summary.tents.includes(tentId)) summary.tents.push(tentId);
        summary.guests += Number(stay.guests ?? 0);
        summary.breakfast += Number(stay.breakfast_csv_quantity ?? 0) + Number(stay.breakfast_addon_quantity ?? 0);
        summary.fika += Number(stay.fikapase_csv_quantity ?? 0) + Number(stay.fikapase_addon_quantity ?? 0);
        next[bookingNumber] = summary;
      }
    }

    setSummaries(next);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const importFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setImporting(true);
    setLogs([]);

    try {
      const parsedFiles = await Promise.all(files.map(parseFile));
      const unknown = parsedFiles.filter((file) => file.kind === "unknown");
      if (unknown.length > 0) {
        throw new Error(`Okänt Sirvoy-format: ${unknown.map((file) => file.name).join(", ")}`);
      }

      const basicFiles = parsedFiles.filter((file) => file.kind === "basic_info");
      const contentFiles = parsedFiles.filter((file) => file.kind === "booking_content");
      const basicRows = basicFiles.flatMap((file) => file.rows);
      const contentRows = contentFiles.flatMap((file) => file.rows);
      const basic = basicRows.length > 0 ? parseBasicInfo(basicRows) : null;

      let contacts = basic?.contacts ?? new Map<string, ParsedBooking>();
      let initialContent = contentRows.length > 0 ? parseBookingContent(contentRows, contacts) : null;
      const allBookingNumbers = Array.from(new Set([
        ...(basic?.bookings.map((booking) => booking.booking_number) ?? []),
        ...(initialContent?.bookingNumbers ?? []),
      ]));

      const existingByNumber = new Map<string, any>();
      if (allBookingNumbers.length > 0) {
        const { data: existingRows } = await (supabase as any)
          .from("bookings")
          .select("*")
          .in("booking_number", allBookingNumbers);
        for (const row of existingRows ?? []) existingByNumber.set(row.booking_number, row);
      }

      // Om Booking content laddas utan Basic info använder vi redan sparade kontakter.
      if (!basic && initialContent) {
        contacts = new Map(
          Array.from(existingByNumber.entries()).map(([bookingNumber, row]) => [bookingNumber, {
            booking_number: bookingNumber,
            guest_name: row.guest_name,
            guest_first_name: row.guest_first_name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            country_code: row.country_code,
            lang: row.lang ?? row.language ?? "sv",
            language: row.language ?? row.lang ?? "sv",
          } satisfies ParsedBooking]),
        );
        initialContent = parseBookingContent(contentRows, contacts);
      }

      const newLogs: ImportLog[] = [];

      if (basic) {
        const mergedRows = basic.bookings.map((booking) => {
          const existing = existingByNumber.get(booking.booking_number);
          return toDatabaseBooking({
            ...booking,
            // Tomma värden i Basic info får aldrig radera fungerande kontaktuppgifter.
            phone: booking.phone ?? existing?.phone ?? null,
            email: booking.email ?? existing?.email ?? null,
            address: booking.address ?? existing?.address ?? null,
            tent_id: existing?.tent_id ?? booking.tent_id ?? null,
            tent_name: existing?.tent_name ?? booking.tent_name ?? null,
            raw: { ...(existing?.raw ?? {}), ...(booking.raw ?? {}) },
          });
        });

        const { error } = await (supabase as any)
          .from("bookings")
          .upsert(mergedRows, { onConflict: "booking_number" });
        if (error) throw new Error(`Basic info: ${error.message}`);

        await runInBatches(basic.bookings, async (booking) => {
          const patch: Record<string, unknown> = {
            guest_name: booking.guest_name ?? undefined,
            lang: booking.lang ?? undefined,
          };
          if (booking.phone) patch.phone = booking.phone;
          if (booking.email) patch.email = booking.email;
          const { error: stayError } = await (supabase as any)
            .from("tent_stays")
            .update(patch)
            .eq("booking_number", booking.booking_number);
          if (stayError) throw stayError;
        });

        newLogs.push({
          file: basicFiles.map((file) => file.name).join(" + "),
          kind: "basic_info",
          message: `${basic.bookings.length} bokningar • ${basic.validPhones} giltiga telefonnummer • ${basic.missingPhones} saknar telefon`,
        });
      }

      if (initialContent) {
        // Basic info importerades först, så bygg om en gång till med de senaste kontakterna.
        const content = parseBookingContent(contentRows, basic?.contacts ?? contacts);
        const bookingRows = content.bookings.map((booking) => {
          const existing = existingByNumber.get(booking.booking_number);
          const contact = basic?.contacts.get(booking.booking_number);
          return toDatabaseBooking({
            ...booking,
            guest_name: contact?.guest_name ?? booking.guest_name ?? existing?.guest_name ?? null,
            guest_first_name: contact?.guest_first_name ?? booking.guest_first_name ?? existing?.guest_first_name ?? null,
            phone: contact?.phone ?? existing?.phone ?? null,
            email: contact?.email ?? existing?.email ?? null,
            address: contact?.address ?? existing?.address ?? null,
            country_code: contact?.country_code ?? existing?.country_code ?? null,
            lang: contact?.lang ?? booking.lang ?? existing?.lang ?? "sv",
            language: contact?.language ?? booking.language ?? existing?.language ?? "sv",
            raw: { ...(existing?.raw ?? {}), ...(booking.raw ?? {}) },
          });
        });

        const { error: bookingError } = await (supabase as any)
          .from("bookings")
          .upsert(bookingRows, { onConflict: "booking_number" });
        if (bookingError) throw new Error(`Booking content/bokningar: ${bookingError.message}`);

        // Radera aldrig hela framtiden. Ersätt bara bokningsnummer som faktiskt finns i filen.
        // Men först: gästernas specialkost (vald på /stay eller vid incheckning) finns
        // bara på tent_stays — säkra den så den inte försvinner vid om-import.
        const { data: existingDietaryRows } = await (supabase as any)
          .from("tent_stays")
          .select("booking_number, tent_id, dietary, dietary_note")
          .in("booking_number", content.bookingNumbers);

        const dietaryByStay = new Map<string, SavedDietary>();
        const dietaryByBooking = new Map<string, SavedDietary>();
        for (const row of existingDietaryRows ?? []) {
          const dietary = Array.isArray(row.dietary)
            ? (row.dietary as unknown[]).filter((d): d is string => typeof d === "string")
            : [];
          const note = typeof row.dietary_note === "string" && row.dietary_note.trim() ? row.dietary_note : null;
          if (dietary.length === 0 && !note) continue;
          dietaryByStay.set(`${row.booking_number}|${row.tent_id}`, { dietary, note });
          const prev = dietaryByBooking.get(row.booking_number) ?? { dietary: [] as string[], note: null as string | null };
          dietaryByBooking.set(row.booking_number, {
            dietary: Array.from(new Set([...prev.dietary, ...dietary])),
            note: prev.note ?? note,
          });
        }

        const { error: deleteError } = await (supabase as any)
          .from("tent_stays")
          .delete()
          .in("booking_number", content.bookingNumbers);
        if (deleteError) throw new Error(`Booking content/rensning: ${deleteError.message}`);

        // Slå ihop CSV-tolkad kost med den sparade webbkosten (aldrig skriv över webben)
        const staysToInsert = mergeDietaryIntoStays(content.stays, dietaryByStay, dietaryByBooking);

        if (staysToInsert.length > 0) {
          const { error: stayError } = await (supabase as any)
            .from("tent_stays")
            .insert(staysToInsert);
          if (stayError) throw new Error(`Booking content/tältvistelser: ${stayError.message}`);
        }

        // Lägg tillbaka aktiva webb-tillägg efter att CSV-raderna har ersatts.
        const { error: syncError } = await (supabase as any).rpc(
          "recalculate_operations_for_booking_numbers",
          { p_booking_numbers: content.bookingNumbers },
        );
        if (syncError) throw new Error(`Tilläggssynk: ${syncError.message}`);

        newLogs.push({
          file: contentFiles.map((file) => file.name).join(" + "),
          kind: "booking_content",
          message: `${content.bookings.length} bokningar • ${content.stays.length} tältvistelser • ${content.breakfastPortions} frukostportioner • ${content.fikaBags} fikapåsar${content.warnings.length ? ` • ${content.warnings.length} varningar` : ""}`,
        });

        if (content.warnings.length > 0) {
          console.warn("Sirvoy import warnings", content.warnings);
          toast.warning(content.warnings[0]);
        }
      }

      setLogs(newLogs);
      toast.success("Sirvoy-filerna importerades och synkades.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Importen misslyckades.");
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return bookings;
    return bookings.filter((booking) => [
      booking.booking_number,
      booking.guest_name,
      booking.phone,
      booking.email,
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [bookings, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Bokningar & Sirvoy-import</h1>
          <p className="mt-1 text-sm text-muted-foreground">Båda Sirvoy-formaten känns igen automatiskt. Det spelar ingen roll i vilken ordning filerna väljs.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || importing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Uppdatera
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Importera Sirvoy</CardTitle>
          <CardDescription>
            Välj gärna båda filerna samtidigt. <strong>Booking content</strong> styr tält, datum, gäster, barn och exakta antal tillval från <em>Units</em>. <strong>Basic info</strong> styr telefon, e-post, språk och adress.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            disabled={importing}
            onChange={(event) => void importFiles(Array.from(event.target.files ?? []))}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2 font-medium"><FileSpreadsheet className="h-4 w-4" /> Booking content</div>
              <p className="text-xs text-muted-foreground">Känns igen på Type, Specification, Room ID och Units. Bara bokningarna i filen ersätts.</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2 font-medium"><FileCheck2 className="h-4 w-4" /> Basic info</div>
              <p className="text-xs text-muted-foreground">Känns igen på Phone, Email och Number of guests. Telefon normaliseras till internationellt +format.</p>
            </div>
          </div>
          {importing && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Kontrollerar och importerar…</div>}
          {logs.map((log) => (
            <div key={`${log.kind}-${log.file}`} className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
              <div className="font-medium">✓ {log.kind === "basic_info" ? "Basic info" : "Booking content"}</div>
              <div className="text-xs text-muted-foreground break-all">{log.file}</div>
              <div className="mt-1">{log.message}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importerade bokningar</CardTitle>
          <CardDescription>Telefon visas i samma +landsnummer-format som används för SMS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sök namn, bokningsnummer, telefon eller e-post" />
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bokning</TableHead>
                  <TableHead>Gäst</TableHead>
                  <TableHead>Vistelse</TableHead>
                  <TableHead>Tält / gäster</TableHead>
                  <TableHead>Tillägg</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>E-post</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((booking) => {
                  const summary = summaries[booking.booking_number];
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono font-medium">{booking.booking_number}</TableCell>
                      <TableCell>{booking.guest_name ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{booking.checkin_date ?? "—"}<br />{booking.checkout_date ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {summary?.tents.map((tent) => <Badge key={tent} variant="outline">{TENT_LABELS[tent] ?? tent}</Badge>)}
                          {summary && <Badge variant="secondary">{summary.guests} gäster</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {!!summary?.breakfast && <Badge>{summary.breakfast} frukost</Badge>}
                          {!!summary?.fika && <Badge variant="secondary">{summary.fika} fika</Badge>}
                          {!summary?.breakfast && !summary?.fika && "—"}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs">{booking.phone ?? <span className="text-destructive">Saknas</span>}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs" title={booking.email ?? ""}>{booking.email ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Inga bokningar hittades.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
