import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { parseBasicInfo, parseBookingContent } from '../src/lib/sirvoy-import';

const bcText = fs.readFileSync('/tmp/import/bc.csv', 'utf8');
const biText = fs.readFileSync('/tmp/import/bi.csv', 'utf8');
const bcRows = parse(bcText, { columns: true, skip_empty_lines: true, relax_column_count: true });
const biRows = parse(biText, { columns: true, skip_empty_lines: true, relax_column_count: true });

const basic = parseBasicInfo(biRows);
const content = parseBookingContent(bcRows, basic.contacts);

fs.writeFileSync('/tmp/import/parsed.json', JSON.stringify({
  basic: basic.bookings,
  content_bookings: content.bookings,
  stays: content.stays,
  bookingNumbers: content.bookingNumbers,
  warnings: content.warnings,
}, null, 2));

console.log('basic bookings:', basic.bookings.length);
console.log('content bookings:', content.bookings.length, 'stays:', content.stays.length);
console.log('warnings:', content.warnings.length);
content.warnings.forEach(w => console.log(' -', w));
