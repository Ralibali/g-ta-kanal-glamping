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
  dietary?: string[]
  dietaryNote?: string | null
}

const fmt = (d?: string | null) => {
  if (!d) return '—'
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('sv-SE', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  } catch { return d }
}

const DIET_LABELS: Record<string, string> = {
  gluten_free: 'Glutenfritt',
  vegan: 'Vegan',
  vegetarian: 'Vegetariskt',
  lactose_free: 'Laktosfritt',
  nut_allergy: 'Nötallergi',
}

const Email = ({
  guestName, tentName, bookingNumber, hasBreakfast, hasFika,
  breakfastDate, fikaDate, items = [], dietary = [], dietaryNote,
}: Props) => {
  const dietLabels = dietary.map((d) => DIET_LABELS[d] ?? d).filter(Boolean)
  const hasDiet = dietLabels.length > 0 || (dietaryNote && dietaryNote.trim().length > 0)

  return (
    <Html lang="sv" dir="ltr">
      <Head />
      <Preview>Ny beställning från {guestName ?? 'en gäst'} 🥐</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Hej Karin! 🌿</Heading>
          <Text style={text}>
            En ny beställning har kommit in — allt är redan synkat till
            {' '}<a href="https://goglampingsweden.se/frukost" style={link}>frukost-sidan</a>.
          </Text>

          <Section style={box}>
            <Text style={kv}>
              <strong>Gäst:</strong> {guestName ?? 'En gäst'}
              {bookingNumber ? <> · bok. {bookingNumber}</> : null}
            </Text>
            <Text style={kv}><strong>Tält:</strong> {tentName}</Text>

            {(hasFika || hasBreakfast) && <Hr style={hr} />}

            {hasFika && (
              <Text style={kv}>
                ☕ <strong>Fikapåse</strong> — {fmt(fikaDate)} <em style={muted}>(incheckningsdagen)</em>
              </Text>
            )}
            {hasBreakfast && (
              <Text style={kv}>
                🥐 <strong>Frukost</strong> — {fmt(breakfastDate)} <em style={muted}>(utcheckningsdagen)</em>
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

          {hasDiet && (
            <Section style={dietBox}>
              <Text style={dietHead}>⚠️ Specialkost</Text>
              {dietLabels.length > 0 && (
                <Text style={kv}>{dietLabels.join(' · ')}</Text>
              )}
              {dietaryNote && dietaryNote.trim().length > 0 && (
                <Text style={small}><em>"{dietaryNote.trim()}"</em></Text>
              )}
            </Section>
          )}

          <Text style={text}>
            Tack för att du tar hand om våra gäster så fint! 💚
          </Text>
          <Text style={signoff}>Bergs Slussar Glamping 🏕️</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Ny frukost-/fikabeställning 🥐',
  displayName: 'Frukost – ny beställning (Karin)',
  previewData: {
    guestName: 'Anna Andersson', tentName: 'Naturkärnan', bookingNumber: 'BOK-1234',
    hasBreakfast: true, hasFika: true,
    breakfastDate: '2026-07-12', fikaDate: '2026-07-10',
    items: [{ name: 'Frukost', quantity: 2 }, { name: 'Fikapåse', quantity: 1 }],
    dietary: ['gluten_free', 'vegan'],
    dietaryNote: 'En gäst är även allergisk mot mandel.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2c5f2e', margin: '0 0 12px' }
const text = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.65', margin: '8px 0' }
const small = { fontSize: '14px', color: '#1a1a1a', lineHeight: '1.55', margin: '4px 0' }
const kv = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.55', margin: '6px 0' }
const muted = { color: '#6b7280', fontStyle: 'italic' as const, fontWeight: 'normal' as const }
const box = { backgroundColor: '#f4f7f1', border: '1px solid #d4e0c9', borderRadius: '8px', padding: '14px 18px', margin: '14px 0' }
const dietBox = { backgroundColor: '#fff4e6', border: '1px solid #f0c987', borderRadius: '8px', padding: '12px 18px', margin: '12px 0' }
const dietHead = { fontSize: '15px', fontWeight: 'bold' as const, color: '#b45309', margin: '0 0 4px' }
const hr = { borderColor: '#d4e0c9', margin: '10px 0' }
const link = { color: '#2c5f2e', textDecoration: 'underline' }
const signoff = { fontSize: '14px', color: '#2c5f2e', fontWeight: 'bold' as const, marginTop: '14px' }
