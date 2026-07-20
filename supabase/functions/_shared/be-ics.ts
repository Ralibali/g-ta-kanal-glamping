// Booking Engine: iCal-parsning (RFC 5545-subset för Airbnb/Booking.com).

export interface IcsEvent {
  uid: string;
  summary: string;
  status: string;
  startDate: string;
  endDate: string;
}

export function unfoldIcs(raw: string): string {
  return raw.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function toDate(value: string): string | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function parseIcs(raw: string): IcsEvent[] {
  const lines = unfoldIcs(raw).split(/\r?\n/);
  const events: IcsEvent[] = [];
  let cur: Partial<IcsEvent> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") { cur = {}; continue; }
    if (line === "END:VEVENT") {
      if (cur?.uid && cur.startDate && cur.endDate && cur.endDate > cur.startDate) {
        events.push({ summary: "", status: "CONFIRMED", ...cur } as IcsEvent);
      }
      cur = null; continue;
    }
    if (!cur) continue;
    const m = line.match(/^([A-Za-z-]+)(?:;[^:]*)?:(.*)$/);
    if (!m) continue;
    const [, name, value] = m;
    switch (name.toUpperCase()) {
      case "UID": cur.uid = value.trim(); break;
      case "SUMMARY": cur.summary = value.trim(); break;
      case "STATUS": cur.status = value.trim().toUpperCase(); break;
      case "DTSTART": cur.startDate = toDate(value) ?? undefined; break;
      case "DTEND": cur.endDate = toDate(value) ?? undefined; break;
    }
  }
  return events;
}

export function isBlockEvent(e: IcsEvent): boolean {
  return /not available|blocked|closed|unavailable/i.test(e.summary);
}

export function guestNameFrom(summary: string): string | null {
  const s = summary.trim();
  if (!s || /^reserved$/i.test(s)) return null;
  return s;
}

// ---------- Export ----------

export interface IcsOutEvent {
  uid: string;
  startDate: string;
  endDate: string;
  summary: string;
}

export function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += 74) {
    parts.push((i === 0 ? "" : " ") + line.slice(i, i + 74));
  }
  return parts.join("\r\n");
}

const toIcsDate = (iso: string) => iso.replace(/-/g, "");

export function buildIcs(events: IcsOutEvent[], calendarName: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Go Glamping Sweden//Booking 1.0//SV",
    "CALSCALE:GREGORIAN",
    foldLine(`X-WR-CALNAME:${icsEscape(calendarName)}`),
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      foldLine(`UID:${e.uid}`),
      `DTSTART;VALUE=DATE:${toIcsDate(e.startDate)}`,
      `DTEND;VALUE=DATE:${toIcsDate(e.endDate)}`,
      foldLine(`SUMMARY:${icsEscape(e.summary)}`),
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
