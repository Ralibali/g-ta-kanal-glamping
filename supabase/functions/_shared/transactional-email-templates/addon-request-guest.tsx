import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Item { name: string; quantity: number; total: number }
interface Props {
  firstName?: string | null
  tentName?: string
  items?: Item[]
  total?: number
  lang?: string
  swishNumber?: string
  swishPayee?: string
  swishReference?: string
}

const COPY = {
  sv: {
    preview: 'Betala med Swish så bekräftar vi din beställning',
    subject: 'Tack! Swisha så bekräftar vi 🌿',
    heading: 'Tack för din beställning!',
    intro: (name: string, tent: string) =>
      `Hej ${name}! Vi har noterat dina tillval till ${tent}. Swisha summan nedan så bekräftar vi så snart vi ser betalningen.`,
    summary: 'Sammanfattning',
    total: (t: number) => `Summa att betala: ${t} kr`,
    swishTitle: 'Betala med Swish',
    swishNumber: 'Swish-nummer',
    swishPayee: 'Mottagare',
    swishAmount: 'Belopp',
    swishRef: 'Meddelande (viktigt!)',
    swishHelp: 'Skriv referensen i Swish-meddelandet så hittar vi din betalning direkt.',
    openSwish: 'Öppna Swish-appen',
    outro: 'Vi ses snart!',
    signoff: 'Bergs Slussar Glamping',
    kr: 'kr',
  },
  en: {
    preview: 'Pay with Swish to confirm your order',
    subject: 'Thank you! Pay with Swish to confirm 🌿',
    heading: 'Thank you for your order!',
    intro: (name: string, tent: string) =>
      `Hi ${name}! We've noted your extras for ${tent}. Please Swish the amount below — we'll confirm as soon as the payment arrives.`,
    summary: 'Summary',
    total: (t: number) => `Total to pay: ${t} SEK`,
    swishTitle: 'Pay with Swish',
    swishNumber: 'Swish number',
    swishPayee: 'Recipient',
    swishAmount: 'Amount',
    swishRef: 'Message (important!)',
    swishHelp: 'Include the reference in the Swish message so we can match your payment instantly.',
    openSwish: 'Open Swish app',
    outro: 'See you soon!',
    signoff: 'Bergs Slussar Glamping',
    kr: 'SEK',
  },
} as const

const Email = ({
  firstName, tentName, items = [], total = 0, lang,
  swishNumber = '1230628289', swishPayee = 'Aurora Media AB', swishReference = '',
}: Props) => {
  const l = (lang ?? 'sv').toLowerCase().startsWith('en') ? 'en' : 'sv'
  const c = COPY[l]
  const name = firstName || (l === 'sv' ? 'där' : 'there')
  const tent = tentName || (l === 'sv' ? 'ert tält' : 'your tent')
  const swishUrl = `https://app.swish.nu/1/p/sw/?sw=${swishNumber}&amt=${total}&cur=SEK&msg=${encodeURIComponent(swishReference)}&src=qr`
  return (
    <Html lang={l} dir="ltr">
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{c.heading}</Heading>
          <Text style={text}>{c.intro(name, tent)}</Text>

          <Heading as="h2" style={h2}>{c.summary}</Heading>
          {items.map((it, i) => (
            <Text key={i} style={text}>• {it.quantity}× {it.name} – {it.total} {c.kr}</Text>
          ))}
          <Text style={totalStyle}>{c.total(total)}</Text>

          <Hr style={hr} />

          <Section style={swishBox}>
            <Heading as="h2" style={h2}>{c.swishTitle}</Heading>
            <Text style={kv}><strong>{c.swishNumber}:</strong> {swishNumber}</Text>
            <Text style={kv}><strong>{c.swishPayee}:</strong> {swishPayee}</Text>
            <Text style={kv}><strong>{c.swishAmount}:</strong> {total} {c.kr}</Text>
            <Text style={kv}><strong>{c.swishRef}:</strong> {swishReference}</Text>
            <Text style={helpText}>{c.swishHelp}</Text>
            <Button href={swishUrl} style={button}>{c.openSwish}</Button>
          </Section>

          <Text style={text}>{c.outro}</Text>
          <Text style={signoff}>{c.signoff} 🏕️</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => {
    const l = (d?.lang ?? 'sv').toLowerCase().startsWith('en') ? 'en' : 'sv'
    return COPY[l].subject
  },
  displayName: 'Tillvalsbeställning – Swish-instruktioner',
  previewData: {
    firstName: 'Anna', tentName: 'Naturkärnan',
    items: [{ name: 'Frukost ×2', quantity: 2, total: 418 }],
    total: 418, lang: 'sv',
    swishNumber: '1230628289', swishPayee: 'Aurora Media AB', swishReference: 'BOK-1234',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2c5f2e', margin: '0 0 16px' }
const h2 = { fontSize: '17px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 10px' }
const text = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.65', margin: '8px 0' }
const totalStyle = { fontSize: '16px', fontWeight: 'bold' as const, color: '#2c5f2e', margin: '12px 0 8px' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const swishBox = { backgroundColor: '#f4f7f1', border: '1px solid #d4e0c9', borderRadius: '8px', padding: '18px 20px', margin: '8px 0 20px' }
const kv = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.55', margin: '4px 0' }
const helpText = { fontSize: '13px', color: '#555', fontStyle: 'italic' as const, margin: '10px 0 14px' }
const button = { backgroundColor: '#2c5f2e', color: '#ffffff', padding: '12px 22px', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const signoff = { fontSize: '15px', color: '#2c5f2e', fontWeight: 'bold' as const, marginTop: '12px' }
