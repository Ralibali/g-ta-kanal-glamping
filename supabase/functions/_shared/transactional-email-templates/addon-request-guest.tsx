import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Item { name: string; quantity: number; total: number }
interface Props {
  firstName?: string | null
  tentName?: string
  items?: Item[]
  total?: number
  lang?: string
}

const COPY = {
  sv: {
    preview: 'Vi har tagit emot ditt tillvalsönskemål',
    subject: 'Tack! Vi har tagit emot ditt önskemål 🌿',
    heading: 'Tack!',
    intro: (name: string, tent: string) =>
      `Hej ${name}! Vi har noterat dina tillval till ${tent}. Du får snart en faktura per mail för betalning.`,
    summary: 'Sammanfattning',
    total: (t: number) => `Summa: ${t} kr`,
    outro: 'Vi ses snart!',
    signoff: 'Bergs Slussar Glamping',
  },
  en: {
    preview: 'We have received your extras request',
    subject: 'Thank you! We have your request 🌿',
    heading: 'Thank you!',
    intro: (name: string, tent: string) =>
      `Hi ${name}! We have noted your extras for ${tent}. You will receive an invoice by email shortly.`,
    summary: 'Summary',
    total: (t: number) => `Total: ${t} SEK`,
    outro: 'See you soon!',
    signoff: 'Bergs Slussar Glamping',
  },
} as const

const Email = ({ firstName, tentName, items = [], total = 0, lang }: Props) => {
  const l = (lang ?? 'sv').toLowerCase().startsWith('en') ? 'en' : 'sv'
  const c = COPY[l]
  const name = firstName || (l === 'sv' ? 'där' : 'there')
  const tent = tentName || (l === 'sv' ? 'ert tält' : 'your tent')
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
            <Text key={i} style={text}>• {it.quantity}× {it.name} – {it.total} {l === 'sv' ? 'kr' : 'SEK'}</Text>
          ))}
          <Text style={totalStyle}>{c.total(total)}</Text>
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
  displayName: 'Tillvalsönskemål – gästbekräftelse',
  previewData: { firstName: 'Anna', tentName: 'Naturkärnan', items: [{ name: 'Frukost ×2', quantity: 2, total: 418 }], total: 418, lang: 'sv' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2c5f2e', margin: '0 0 16px' }
const h2 = { fontSize: '17px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '20px 0 8px' }
const text = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.65', margin: '8px 0' }
const totalStyle = { fontSize: '16px', fontWeight: 'bold' as const, color: '#2c5f2e', margin: '12px 0 20px' }
const signoff = { fontSize: '15px', color: '#2c5f2e', fontWeight: 'bold' as const, marginTop: '12px' }
