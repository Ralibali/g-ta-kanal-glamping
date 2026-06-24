import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Item { name: string; quantity: number }
interface Props {
  guestName?: string | null
  tentName?: string
  bookingNumber?: string | null
  hasBreakfast?: boolean
  hasFika?: boolean
  breakfastDate?: string | null
  fikaDate?: string | null
  items?: Item[]
}

const fmt = (d?: string | null) => {
  if (!d) return '—'
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('sv-SE', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  } catch { return d }
}

const Email = ({
  guestName, tentName, bookingNumber, hasBreakfast, hasFika,
  breakfastDate, fikaDate, items = [],
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Ny frukost-/fikabeställning</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Ny beställning 🥐</Heading>
        <Text style={text}>
          {guestName ?? 'En gäst'} har lagt en beställning till <strong>{tentName}</strong>
          {bookingNumber ? <> (bok. {bookingNumber})</> : null}.
        </Text>

        <Section style={box}>
          {hasFika && (
            <Text style={kv}>
              <strong>Fikapåse</strong> — levereras <strong>{fmt(fikaDate)}</strong> (incheckningsdagen)
            </Text>
          )}
          {hasBreakfast && (
            <Text style={kv}>
              <strong>Frukost</strong> — levereras <strong>{fmt(breakfastDate)}</strong> (utcheckningsdagen)
            </Text>
          )}
          {items.length > 0 && (
            <>
              <Hr style={hr} />
              {items.map((i, idx) => (
                <Text key={idx} style={small}>• {i.quantity}× {i.name}</Text>
              ))}
            </>
          )}
        </Section>

        <Text style={text}>
          Beställningen är redan synkad till frukost-sidan: <a href="https://goglampingsweden.se/frukost">goglampingsweden.se/frukost</a>
        </Text>
        <Text style={signoff}>Bergs Slussar Glamping 🏕️</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Ny frukost-/fikabeställning',
  displayName: 'Frukost – ny beställning (Karin)',
  previewData: {
    guestName: 'Anna Andersson', tentName: 'Naturkärnan', bookingNumber: 'BOK-1234',
    hasBreakfast: true, hasFika: true,
    breakfastDate: '2026-07-12', fikaDate: '2026-07-10',
    items: [{ name: 'Frukost', quantity: 2 }, { name: 'Fikapåse', quantity: 1 }],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2c5f2e', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.65', margin: '8px 0' }
const small = { fontSize: '14px', color: '#1a1a1a', lineHeight: '1.55', margin: '4px 0' }
const kv = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.55', margin: '6px 0' }
const box = { backgroundColor: '#f4f7f1', border: '1px solid #d4e0c9', borderRadius: '8px', padding: '14px 18px', margin: '12px 0' }
const hr = { borderColor: '#d4e0c9', margin: '10px 0' }
const signoff = { fontSize: '14px', color: '#2c5f2e', fontWeight: 'bold' as const, marginTop: '14px' }
