import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Bergs Slussar Glamping'

interface Issue { description: string; photoUrl?: string }

interface Props {
  tentName?: string
  tentNo?: number
  date?: string
  completedAt?: string
  hasArrival?: boolean
  guests?: number
  bookingNumber?: string
  breakfast?: boolean
  fikapase?: boolean
  lateCheckout?: boolean
  smsStatus?: string
  issues?: Issue[]
  adminUrl?: string
}

const CleaningCompleteEmail = ({
  tentName, tentNo, date, completedAt, hasArrival, guests, bookingNumber,
  breakfast, fikapase, lateCheckout, smsStatus, issues = [], adminUrl,
}: Props) => {
  const hasIssues = issues.length > 0
  const tillval = [breakfast ? 'Frukost' : null, fikapase ? 'Fikapåse' : null, lateCheckout ? 'Sen utcheckning' : null]
    .filter(Boolean).join(', ')
  return (
    <Html lang="sv" dir="ltr">
      <Head />
      <Preview>
        {hasIssues
          ? `⚠️ ${tentName} städat – ${issues.length} fel rapporterade`
          : `✅ ${tentName} städat och klart`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {hasIssues ? '⚠️ Tält städat – fel rapporterade' : '✅ Tält städat och klart'}
          </Heading>

          <Section style={card}>
            <Text style={label}>Tält</Text>
            <Text style={value}>Tält {tentNo} – {tentName}</Text>

            <Text style={label}>Datum</Text>
            <Text style={value}>{date} {completedAt ? `(klart ${completedAt})` : null}</Text>

            <Text style={label}>Ankomst idag</Text>
            <Text style={value}>
              {hasArrival
                ? `Ja – ${guests ?? '?'} gäster${bookingNumber ? ` (bokning ${bookingNumber})` : ''}`
                : 'Nej'}
            </Text>

            {hasArrival && tillval ? (
              <>
                <Text style={label}>Tillval</Text>
                <Text style={value}>{tillval}</Text>
              </>
            ) : null}

            <Text style={label}>SMS till gäst</Text>
            <Text style={value}>{smsStatus ?? '—'}</Text>
          </Section>

          {hasIssues ? (
            <Section style={{ ...card, borderColor: '#f0c987', backgroundColor: '#fdf6e7' }}>
              <Text style={label}>Rapporterade fel ({issues.length})</Text>
              {issues.map((it, i) => (
                <Text key={i} style={message}>
                  • {it.description}
                  {it.photoUrl ? <> — <a href={it.photoUrl} style={link}>foto</a></> : null}
                </Text>
              ))}
            </Section>
          ) : (
            <Text style={text}>Inga fel rapporterade. 👍</Text>
          )}

          {adminUrl ? (
            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button href={adminUrl} style={button}>Öppna i admin</Button>
            </Section>
          ) : null}

          <Text style={footer}>
            Du får detta mail som administratör för {SITE_NAME}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: CleaningCompleteEmail,
  subject: (d: Record<string, any>) => {
    const issues = Array.isArray(d?.issues) ? d.issues.length : 0
    return issues > 0
      ? `⚠️ Tält ${d?.tentNo ?? ''} ${d?.tentName ?? ''} städat – ${issues} fel`
      : `✅ Tält ${d?.tentNo ?? ''} ${d?.tentName ?? ''} städat och klart`
  },
  displayName: 'Städning klar – notis till ägare',
  to: 'info@auroramedia.se',
  previewData: {
    tentName: 'Naturkärnan', tentNo: 2, date: '2026-06-19', completedAt: '11:42',
    hasArrival: true, guests: 2, bookingNumber: '26367', breakfast: true,
    smsStatus: 'sent',
    issues: [{ description: 'Trasig stol vid bordet' }],
    adminUrl: 'https://goglampingsweden.se/admin',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#2c5f2e', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#4a4a4a', lineHeight: '1.6', margin: '12px 0' }
const card = { backgroundColor: '#f7f5ef', border: '1px solid #ece7d8', borderRadius: '8px', padding: '18px 20px', margin: '0 0 12px' }
const label = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#8a8a8a', margin: '12px 0 4px' }
const value = { fontSize: '15px', color: '#1a1a1a', margin: '0 0 8px' }
const message = { fontSize: '14px', color: '#1a1a1a', lineHeight: '1.6', margin: '6px 0' }
const link = { color: '#2c5f2e', textDecoration: 'underline' }
const button = { backgroundColor: '#2c5f2e', color: '#ffffff', padding: '12px 24px', borderRadius: '999px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }
