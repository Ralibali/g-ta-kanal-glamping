import fs from 'node:fs';
const p = JSON.parse(fs.readFileSync('/tmp/import/parsed.json', 'utf8'));

const esc = (v: any) => v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const num = (v: any) => (v === null || v === undefined || v === '') ? 'NULL' : String(v);
const bool = (v: any) => v ? 'TRUE' : 'FALSE';
const jsonb = (v: any) => v === null || v === undefined ? "'{}'::jsonb" : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const arr = (v: string[]) => v && v.length ? `ARRAY[${v.map(esc).join(',')}]::text[]` : `ARRAY[]::text[]`;

const merged = new Map<string, any>();
for (const b of p.basic) merged.set(b.booking_number, { ...b });
for (const b of p.content_bookings) {
  const prev = merged.get(b.booking_number) ?? {};
  const src = { ...(prev.raw || {}), ...(b.raw || {}) };
  const minRaw: Record<string, any> = {};
  for (const k of ['children_total', 'number_of_guests', 'number_of_rooms', 'tent_ids', 'breakfast_csv_quantity', 'fikapase_csv_quantity']) {
    if (src[k] !== undefined) minRaw[k] = src[k];
  }
  merged.set(b.booking_number, { ...prev, ...b, raw: minRaw });
}

// Single INSERT with many VALUES rows for bookings
const bookingRows = Array.from(merged.values()).map(b =>
  `(${esc(b.booking_number)}, ${esc(b.sirvoy_booking_no)}, ${esc(b.guest_name)}, ${esc(b.guest_first_name)}, ${esc(b.email)}, ${esc(b.phone)}, ${esc(b.address)}, ${esc(b.country_code)}, ${esc(b.checkin_date)}, ${esc(b.checkout_date)}, ${esc(b.tent_id)}, ${esc(b.tent_name)}, ${num(b.amount)}, ${esc(b.lang)}, ${esc(b.language)}, ${num(b.nights)}, ${jsonb(b.raw)})`
);
const bookingsSql = `INSERT INTO public.bookings (booking_number, sirvoy_booking_no, guest_name, guest_first_name, email, phone, address, country_code, checkin_date, checkout_date, tent_id, tent_name, amount, lang, language, nights, raw)
VALUES
${bookingRows.join(',\n')}
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
  raw = COALESCE(public.bookings.raw, '{}'::jsonb) || COALESCE(EXCLUDED.raw, '{}'::jsonb);`;

const bookingNumbers = p.bookingNumbers as string[];
const stayRows = p.stays.map((s: any) => {
  const stayRaw: Record<string, any> = {};
  if (s.raw?.child_allocation) stayRaw.child_allocation = s.raw.child_allocation;
  return `(${esc(s.booking_number)}, ${esc(s.room_id)}, ${esc(s.tent_id)}, ${esc(s.checkin_date)}, ${esc(s.checkout_date)}, ${num(s.adults)}, ${num(s.children)}, ${bool(s.breakfast)}, ${bool(s.fikapase)}, ${bool(s.late_checkout)}, ${bool(s.late_checkout_csv)}, ${num(s.breakfast_csv_quantity)}, ${num(s.breakfast_addon_quantity)}, ${num(s.fikapase_csv_quantity)}, ${num(s.fikapase_addon_quantity)}, ${esc(s.guest_name)}, ${esc(s.phone)}, ${esc(s.email)}, ${esc(s.lang)}, ${esc(s.note)}, ${arr(s.dietary)}, ${esc(s.dietary_note)}, ${jsonb(stayRaw)}, ${esc(s.import_source)}, ${esc(s.imported_at)})`;
});
const staysSql = `DELETE FROM public.tent_stays WHERE booking_number IN (${bookingNumbers.map(esc).join(',')});
INSERT INTO public.tent_stays (booking_number, room_id, tent_id, checkin_date, checkout_date, adults, children, breakfast, fikapase, late_checkout, late_checkout_csv, breakfast_csv_quantity, breakfast_addon_quantity, fikapase_csv_quantity, fikapase_addon_quantity, guest_name, phone, email, lang, note, dietary, dietary_note, raw, import_source, imported_at)
VALUES
${stayRows.join(',\n')};`;

fs.writeFileSync('/tmp/import/bookings.sql', bookingsSql);
fs.writeFileSync('/tmp/import/stays.sql', staysSql);
console.log('bookings.sql:', bookingsSql.length, 'bytes');
console.log('stays.sql:', staysSql.length, 'bytes');
