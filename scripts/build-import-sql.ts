import fs from 'node:fs';
const p = JSON.parse(fs.readFileSync('/tmp/import/parsed.json', 'utf8'));

const esc = (v: any) => v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const num = (v: any) => (v === null || v === undefined || v === '') ? 'NULL' : String(v);
const bool = (v: any) => v ? 'TRUE' : 'FALSE';
const jsonb = (v: any) => v === null || v === undefined ? 'NULL' : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const arr = (v: string[]) => v && v.length ? `ARRAY[${v.map(esc).join(',')}]::text[]` : `ARRAY[]::text[]`;

// Merge basic + content bookings by booking_number (content wins for tent/nights/dates)
const merged = new Map<string, any>();
for (const b of p.basic) merged.set(b.booking_number, { ...b });
for (const b of p.content_bookings) {
  const prev = merged.get(b.booking_number) ?? {};
  merged.set(b.booking_number, { ...prev, ...b, raw: { ...(prev.raw || {}), ...(b.raw || {}) } });
}

const lines: string[] = [];

// Bookings upsert
lines.push('-- Upsert bookings');
for (const b of merged.values()) {
  lines.push(`INSERT INTO public.bookings (booking_number, sirvoy_booking_no, guest_name, guest_first_name, email, phone, address, country_code, checkin_date, checkout_date, tent_id, tent_name, amount, lang, language, nights, raw)
VALUES (${esc(b.booking_number)}, ${esc(b.sirvoy_booking_no)}, ${esc(b.guest_name)}, ${esc(b.guest_first_name)}, ${esc(b.email)}, ${esc(b.phone)}, ${esc(b.address)}, ${esc(b.country_code)}, ${esc(b.checkin_date)}, ${esc(b.checkout_date)}, ${esc(b.tent_id)}, ${esc(b.tent_name)}, ${num(b.amount)}, ${esc(b.lang)}, ${esc(b.language)}, ${num(b.nights)}, ${jsonb(b.raw)})
ON CONFLICT (booking_number) DO UPDATE SET
  sirvoy_booking_no = COALESCE(EXCLUDED.sirvoy_booking_no, public.bookings.sirvoy_booking_no),
  guest_name = COALESCE(EXCLUDED.guest_name, public.bookings.guest_name),
  guest_first_name = COALESCE(EXCLUDED.guest_first_name, public.bookings.guest_first_name),
  email = COALESCE(NULLIF(EXCLUDED.email, ''), public.bookings.email),
  phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.bookings.phone),
  address = COALESCE(EXCLUDED.address, public.bookings.address),
  country_code = COALESCE(EXCLUDED.country_code, public.bookings.country_code),
  checkin_date = COALESCE(EXCLUDED.checkin_date, public.bookings.checkin_date),
  checkout_date = COALESCE(EXCLUDED.checkout_date, public.bookings.checkout_date),
  tent_id = COALESCE(EXCLUDED.tent_id, public.bookings.tent_id),
  tent_name = COALESCE(EXCLUDED.tent_name, public.bookings.tent_name),
  amount = COALESCE(EXCLUDED.amount, public.bookings.amount),
  lang = COALESCE(EXCLUDED.lang, public.bookings.lang),
  language = COALESCE(EXCLUDED.language, public.bookings.language),
  nights = COALESCE(EXCLUDED.nights, public.bookings.nights),
  raw = COALESCE(public.bookings.raw, '{}'::jsonb) || COALESCE(EXCLUDED.raw, '{}'::jsonb);`);
}

// Delete existing tent_stays for these booking numbers, then insert fresh
const bookingNumbers = p.bookingNumbers as string[];
lines.push('\n-- Replace tent_stays for imported bookings');
lines.push(`DELETE FROM public.tent_stays WHERE booking_number IN (${bookingNumbers.map(esc).join(',')});`);

for (const s of p.stays) {
  lines.push(`INSERT INTO public.tent_stays (booking_number, room_id, tent_id, checkin_date, checkout_date, adults, children, breakfast, fikapase, late_checkout, late_checkout_csv, breakfast_csv_quantity, breakfast_addon_quantity, fikapase_csv_quantity, fikapase_addon_quantity, guest_name, phone, email, lang, note, dietary, dietary_note, raw, import_source, imported_at)
VALUES (${esc(s.booking_number)}, ${esc(s.room_id)}, ${esc(s.tent_id)}, ${esc(s.checkin_date)}, ${esc(s.checkout_date)}, ${num(s.adults)}, ${num(s.children)}, ${bool(s.breakfast)}, ${bool(s.fikapase)}, ${bool(s.late_checkout)}, ${bool(s.late_checkout_csv)}, ${num(s.breakfast_csv_quantity)}, ${num(s.breakfast_addon_quantity)}, ${num(s.fikapase_csv_quantity)}, ${num(s.fikapase_addon_quantity)}, ${esc(s.guest_name)}, ${esc(s.phone)}, ${esc(s.email)}, ${esc(s.lang)}, ${esc(s.note)}, ${arr(s.dietary)}, ${esc(s.dietary_note)}, ${jsonb(s.raw)}, ${esc(s.import_source)}, ${esc(s.imported_at)});`);
}

// Delete cancelled bookings not in CSV (future only)
const cancelled = ['26370', '26381', '26449', '26483'];
lines.push('\n-- Cancelled bookings (in DB but missing from CSV)');
lines.push(`DELETE FROM public.tent_stays WHERE booking_number IN (${cancelled.map(esc).join(',')});`);
lines.push(`DELETE FROM public.addon_orders WHERE booking_id IN (SELECT id FROM public.bookings WHERE booking_number IN (${cancelled.map(esc).join(',')}));`);
lines.push(`DELETE FROM public.check_ins WHERE booking_number IN (${cancelled.map(esc).join(',')});`);
lines.push(`DELETE FROM public.bookings WHERE booking_number IN (${cancelled.map(esc).join(',')});`);

fs.writeFileSync('/tmp/import/import.sql', lines.join('\n\n'));
console.log('SQL written. Lines:', lines.length);
