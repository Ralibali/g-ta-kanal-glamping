import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Item { name: string; quantity: number; total: number }
interface Props {
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  tentName?: string
  checkinDate?: string
  items?: Item[]
  total?: number
  reference?: string
  minutesAgo?: number
  stage?: '30m' | '2h'
  adminUrl?: string
}

const Email = ({
  guestName, guestEmail, guestPhone, tentName, checkinDate,
  items = [], total = 0, reference, minutesAgo, stage, adminUrl,
}: Props) => {
  const isUrgent = stage === '2h'
  const headline = isUrgent
    ? '⚠️ Swish-betalning saknas fortfarande'
    : '⏰ Swish-betalning ännu ej bekräftad'
  const ageLabel = minutesAgo && minutesAgo >= 60
    ? `${Math.round(minutesAgo / 60)} tim`
    : `${minutesAgo ?? '?'} min`

  return (
    <Html lang="sv" dir="ltr">
      <Head />
      <Preview>{headline} – {guestName ?? 'gäst'} ({ageLabel})</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={isUrgent ? h1Urgent : h1}>{headline}</Heading>
          <Text style={text}>
            En tillvalsbeställning har varit obetald i <strong>{ageLabel}</strong>.
            {isUrgent ? ' Kontakta gästen om betalningen inte kommit in.' : ' Kontrollera Swish-appen.'}
          </Text>

          <Section style={card}>
            <Text style={label}>Gäst</Text>
            <Text style={value}>{guestName ?? '—'}</Text>
            {guestEmail && (<><Text style={label}>E-post</Text><Text style={value}>{guestEmail}</Text></>)}
            {guestPhone && (<><Text style={label}>Telefon</Text><Text style={value}>{guestPhone}</Text></>)}
            <Text style={label}>Tält / incheckning</Text>
            <Text style={value}>{tentName ?? '—'} • {checkinDate ?? '—'}</Text>
            <Text style={label}>Swish-referens</Text>
            <Text style={valueMono}>{reference ?? '—'}</Text>
          </Section>

          <Heading as="h2" style={h2}>Önskade tillval</Heading>
          {items.map((it, i) => (
            <Text key={i} style={text}>• {it.quantity}× {it.name} – {it.total} kr</Text>
          ))}
          <Text style={total_}>Summa: {total} kr</Text>

          {adminUrl && (
            <Button href={adminUrl} style={button}>Öppna admin →</Button>
          )}
          <Text style={helpText}>
            Klicka <strong>Markera som betald</strong> i admin så slutar påminnelserna.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => {
    const stage = d?.stage === '2h' ? '⚠️ 2h' : '⏰ 30 min'
    return `${stage} – Swish obetald: ${d?.guestName ?? 'gäst'} (${d?.total ?? 0} kr)`
  },
  displayName: 'Swish-påminnelse (obekräftad betalning)',
  previewData: {
    guestName: 'Anna Andersson', guestEmail: 'anna@example.com', guestPhone: '070-1234567',
    tentName: 'Naturkärnan', checkinDate: '2026-07-20',
    items: [{ name: 'Frukost', quantity: 2, total: 418 }],
    total: 418, reference: 'BOK-1234', minutesAgo: 35, stage: '30m',
    adminUrl: 'https://goglampingsweden.se/admin/addon-orders',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#c9a84c', margin: '0 0 16px' }
const h1Urgent = { fontSize: '22px', fontWeight: 'bold' as const, color: '#c0392b', margin: '0 0 16px' }
const h2 = { fontSize: '17px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '16px 0 8px' }
const text = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.6', margin: '6px 0' }
const total_ = { fontSize: '16px', fontWeight: 'bold' as const, color: '#2c5f2e', margin: '12px 0' }
const card = { backgroundColor: '#f7f5ef', border: '1px solid #ece7d8', borderRadius: '8px', padding: '14px 18px', margin: '0 0 12px' }
const label = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#8a8a8a', margin: '0 0 4px' }
const value = { fontSize: '15px', color: '#1a1a1a', margin: '0 0 10px' }
const valueMono = { fontSize: '15px', color: '#1a1a1a', margin: '0 0 10px', fontFamily: 'monospace' }
const button = { backgroundColor: '#2c5f2e', color: '#ffffff', padding: '12px 22px', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block', margin: '10px 0' }
const helpText = { fontSize: '13px', color: '#555', fontStyle: 'italic' as const, margin: '8px 0 0' }
