import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Row {
  date: string
  tentName: string
  bookingNumber?: string | null
  guestName?: string | null
  guests?: number
  kind: 'breakfast' | 'fikapase'
  dietary?: string[]
  dietaryNote?: string | null
}
interface Props {
  windowLabel?: string
  rows?: Row[]
}

const fmt = (d?: string | null) => {
  if (!d) return '—'
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('sv-SE', {
      weekday: 'short', day: 'numeric', month: 'short',
    })
  } catch { return d }
}

const Email = ({ windowLabel = 'kommande dagar', rows = [] }: Props) => {
  const byDate = new Map<string, Row[]>()
  for (const r of rows) {
    if (!byDate.has(r.date)) byDate.set(r.date, [])
    byDate.get(r.date)!.push(r)
  }
  const dates = Array.from(byDate.keys()).sort()
  const totalBf = rows.filter(r => r.kind === 'breakfast').reduce((s, r) => s + (r.guests ?? 0), 0)
  const totalFk = rows.filter(r => r.kind === 'fikapase').length

  return (
    <Html lang="sv" dir="ltr">
      <Head />
      <Preview>Frukost & fika – uppdatering ({rows.length} leveranser)</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Frukost & fika 🥐</Heading>
          <Text style={text}>
            Här är uppdateringen för <strong>{windowLabel}</strong>. Totalt
            <strong> {totalBf}</strong> frukostportioner och <strong>{totalFk}</strong> fikapåsar.
          </Text>

          {dates.length === 0 ? (
            <Text style={text}>Inga beställningar i perioden 🌿</Text>
          ) : (
            dates.map((d) => (
              <Section key={d} style={box}>
                <Text style={dateLine}>{fmt(d)}</Text>
                {byDate.get(d)!.map((r, i) => (
                  <Text key={i} style={small}>
                    • {r.kind === 'breakfast' ? '🥐 Frukost' : '🍪 Fikapåse'} — <strong>{r.tentName}</strong>
                    {r.guests ? <> · {r.guests} pers</> : null}
                    {r.guestName ? <> · {r.guestName}</> : null}
                    {r.bookingNumber ? <> · {r.bookingNumber}</> : null}
                    {r.dietary && r.dietary.length > 0 ? <> · {r.dietary.join(', ')}</> : null}
                    {r.dietaryNote ? <> · {r.dietaryNote}</> : null}
                  </Text>
                ))}
              </Section>
            ))
          )}

          <Hr style={hr} />
          <Text style={text}>
            Se hela vyn på <a href="https://goglampingsweden.se/frukost">goglampingsweden.se/frukost</a>
          </Text>
          <Text style={signoff}>Bergs Slussar Glamping 🏕️</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Frukost & fika – uppdatering',
  displayName: 'Frukost – digest (Karin)',
  previewData: {
    windowLabel: 'kommande veckan',
    rows: [
      { date: '2026-07-10', tentName: 'Naturkärnan', guestName: 'Anna', guests: 2, kind: 'fikapase' as const },
      { date: '2026-07-12', tentName: 'Naturkärnan', guestName: 'Anna', guests: 2, kind: 'breakfast' as const, dietary: ['gluten_free'] },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '600px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2c5f2e', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.65', margin: '8px 0' }
const small = { fontSize: '14px', color: '#1a1a1a', lineHeight: '1.55', margin: '4px 0' }
const dateLine = { fontSize: '15px', color: '#2c5f2e', fontWeight: 'bold' as const, textTransform: 'capitalize' as const, margin: '0 0 6px' }
const box = { backgroundColor: '#f4f7f1', border: '1px solid #d4e0c9', borderRadius: '8px', padding: '12px 16px', margin: '10px 0' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const signoff = { fontSize: '14px', color: '#2c5f2e', fontWeight: 'bold' as const, marginTop: '14px' }
