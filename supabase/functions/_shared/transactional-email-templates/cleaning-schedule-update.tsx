import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Bergs Slussar Glamping'

interface DayEntry {
  date: string
  tents: { tentNo: number; tentName: string; arrival: boolean; departure: boolean }[]
}

interface Props {
  dates?: string[]
  days?: DayEntry[]
  note?: string
  cleaningUrl?: string
}

const CleaningScheduleUpdateEmail = ({ dates = [], days = [], note, cleaningUrl }: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Städschemat är uppdaterat ({dates.join(', ')})</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Städschemat är uppdaterat</Heading>
        <Text style={text}>
          Hej Karin! Följande datum har uppdaterats i städschemat:
        </Text>

        {days.map((d) => (
          <Section key={d.date} style={card}>
            <Text style={label}>Datum</Text>
            <Text style={value}>{d.date}</Text>
            {d.tents.length === 0 ? (
              <Text style={message}>Inga tält att städa.</Text>
            ) : d.tents.map((t, i) => (
              <Text key={i} style={message}>
                • Tält {t.tentNo} – {t.tentName}
                {t.arrival && t.departure ? ' (växling: avresa + ankomst)'
                  : t.arrival ? ' (ankomst)'
                  : t.departure ? ' (avresa)' : ''}
              </Text>
            ))}
          </Section>
        ))}

        {note ? (
          <Section style={{ ...card, borderColor: '#f0c987', backgroundColor: '#fdf6e7' }}>
            <Text style={label}>Meddelande</Text>
            <Text style={message}>{note}</Text>
          </Section>
        ) : null}

        {cleaningUrl ? (
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={cleaningUrl} style={button}>Öppna städ-appen</Button>
          </Section>
        ) : null}

        <Text style={footer}>Du får detta mail som städansvarig för {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CleaningScheduleUpdateEmail,
  subject: (d: Record<string, any>) => {
    const dates = Array.isArray(d?.dates) ? d.dates : []
    return `Städschema uppdaterat – ${dates.join(', ') || 'nya datum'}`
  },
  displayName: 'Städschema uppdaterat – notis till städare',
  to: 'karin@topstad.se',
  previewData: {
    dates: ['2026-06-20', '2026-06-22'],
    days: [
      { date: '2026-06-20', tents: [
        { tentNo: 1, tentName: 'Sjöbris', arrival: true, departure: true },
        { tentNo: 2, tentName: 'Naturkärnan', arrival: true, departure: false },
      ]},
      { date: '2026-06-22', tents: [
        { tentNo: 3, tentName: 'Lugnets yta', arrival: false, departure: true },
      ]},
    ],
    note: 'Dessa datum har ändrats.',
    cleaningUrl: 'https://goglampingsweden.se/stad',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#2c5f2e', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#4a4a4a', lineHeight: '1.6', margin: '12px 0' }
const card = { backgroundColor: '#f7f5ef', border: '1px solid #ece7d8', borderRadius: '8px', padding: '18px 20px', margin: '0 0 12px' }
const label = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#8a8a8a', margin: '12px 0 4px' }
const value = { fontSize: '15px', color: '#1a1a1a', margin: '0 0 8px', fontWeight: 'bold' as const }
const message = { fontSize: '14px', color: '#1a1a1a', lineHeight: '1.6', margin: '6px 0' }
const button = { backgroundColor: '#2c5f2e', color: '#ffffff', padding: '12px 24px', borderRadius: '999px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }
