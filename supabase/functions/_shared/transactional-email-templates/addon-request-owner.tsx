import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Item { name: string; quantity: number; total: number }
interface Props {
  guestName?: string
  tentName?: string
  checkinDate?: string
  items?: Item[]
  total?: number
  adminUrl?: string
  hasEarlyCheckin?: boolean
}

const Email = ({ guestName, tentName, checkinDate, items = [], total = 0, adminUrl, hasEarlyCheckin }: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Nytt tillvalsönskemål från {guestName ?? 'gäst'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🛎️ Nytt tillvalsönskemål</Heading>
        <Section style={card}>
          <Text style={label}>Gäst</Text>
          <Text style={value}>{guestName ?? '—'}</Text>
          <Text style={label}>Tält / incheckning</Text>
          <Text style={value}>{tentName ?? '—'} • {checkinDate ?? '—'}</Text>
        </Section>
        {hasEarlyCheckin && (
          <Section style={alert}>
            <Text style={alertText}>⏰ Inkluderar TIDIG INCHECKNING – bekräfta i admin så flaggas städningen för prioritet.</Text>
          </Section>
        )}
        <Heading as="h2" style={h2}>Önskade tillval</Heading>
        {items.map((it, i) => (
          <Text key={i} style={text}>• {it.quantity}× {it.name} – {it.total} kr</Text>
        ))}
        <Text style={total_}>Summa: {total} kr</Text>
        <Text style={text}>Fakturera gästen manuellt och bekräfta i admin.</Text>
        {adminUrl && <Text style={text}><a href={adminUrl} style={link}>Öppna admin →</a></Text>}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Tillvalsönskemål: ${d?.guestName ?? 'gäst'} – ${d?.tentName ?? ''}`,
  displayName: 'Tillvalsönskemål – ägarnotis',
  previewData: { guestName: 'Anna Andersson', tentName: 'Naturkärnan', checkinDate: '2026-07-15', items: [{ name: 'Frukost ×2', quantity: 2, total: 418 }], total: 418, hasEarlyCheckin: false, adminUrl: 'https://goglampingsweden.se/admin/addon-orders' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2c5f2e', margin: '0 0 16px' }
const h2 = { fontSize: '17px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '16px 0 8px' }
const text = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.6', margin: '6px 0' }
const total_ = { fontSize: '16px', fontWeight: 'bold' as const, color: '#2c5f2e', margin: '12px 0' }
const card = { backgroundColor: '#f7f5ef', border: '1px solid #ece7d8', borderRadius: '8px', padding: '14px 18px', margin: '0 0 12px' }
const label = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#8a8a8a', margin: '0 0 4px' }
const value = { fontSize: '15px', color: '#1a1a1a', margin: '0 0 10px' }
const alert = { backgroundColor: '#fff3e0', border: '1px solid #ffb74d', borderRadius: '8px', padding: '12px 16px', margin: '0 0 12px' }
const alertText = { fontSize: '14px', color: '#e65100', fontWeight: 'bold' as const, margin: 0 }
const link = { color: '#2c5f2e', textDecoration: 'underline' }
