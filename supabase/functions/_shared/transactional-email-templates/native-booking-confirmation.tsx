import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  guestName?: string | null
  tentName?: string | null
  checkin?: string
  checkout?: string
  total?: number
  paymentRef?: string | null
  guestToken?: string | null
  lang?: string
}

const fmtDate = (value?: string, lang = 'sv') => {
  if (!value) return '–'
  return new Date(`${value}T12:00:00`).toLocaleDateString(
    lang === 'sv' ? 'sv-SE' : lang === 'de' ? 'de-DE' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' },
  )
}

const fmtMoney = (value?: number) => `${Math.round(value ?? 0).toLocaleString('sv-SE')} kr`

const BookingConfirmation = ({ guestName, tentName, checkin, checkout, total, paymentRef, guestToken, lang }: Props) => {
  const l = lang === 'de' ? 'de' : lang === 'en' ? 'en' : 'sv'
  const copy = l === 'sv'
    ? {
        preview: 'Din bokning hos Bergs Slussar Glamping är bekräftad',
        title: 'Bokningen är klar 🌿',
        hello: `Hej${guestName ? ` ${guestName}` : ''}!`,
        body: 'Tack för din bokning. Betalningen är mottagen och vistelsen är reserverad direkt hos oss.',
        stay: 'Din vistelse', tent: 'Tält', in: 'Incheckning', out: 'Utcheckning', paid: 'Betalt', ref: 'Bokningsreferens',
        guest: 'Öppna din gästsida',
        footer: 'Inför ankomsten skickar vi den praktiska information du behöver. Vi ser fram emot att välkomna dig till Göta kanal!',
      }
    : l === 'de'
      ? {
          preview: 'Ihre Buchung bei Bergs Slussar Glamping ist bestätigt',
          title: 'Ihre Buchung ist bestätigt 🌿',
          hello: `Hallo${guestName ? ` ${guestName}` : ''}!`,
          body: 'Vielen Dank für Ihre Buchung. Die Zahlung ist eingegangen und Ihr Aufenthalt ist direkt bei uns reserviert.',
          stay: 'Ihr Aufenthalt', tent: 'Zelt', in: 'Check-in', out: 'Check-out', paid: 'Bezahlt', ref: 'Buchungsreferenz',
          guest: 'Gästeseite öffnen',
          footer: 'Vor Ihrer Anreise senden wir Ihnen alle praktischen Informationen. Wir freuen uns darauf, Sie am Göta-Kanal willkommen zu heißen!',
        }
      : {
          preview: 'Your Bergs Slussar Glamping booking is confirmed',
          title: 'Your booking is confirmed 🌿',
          hello: `Hi${guestName ? ` ${guestName}` : ''}!`,
          body: 'Thank you for booking directly with us. Your payment has been received and your stay is reserved.',
          stay: 'Your stay', tent: 'Tent', in: 'Check-in', out: 'Check-out', paid: 'Paid', ref: 'Booking reference',
          guest: 'Open your guest page',
          footer: 'We will send the practical arrival information before your stay. We look forward to welcoming you by the Göta Canal!',
        }

  const guestUrl = guestToken ? `https://goglampingsweden.se/stay/${guestToken}` : null

  return (
    <Html lang={l}>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{copy.title}</Heading>
          <Text style={text}>{copy.hello}</Text>
          <Text style={text}>{copy.body}</Text>
          <Section style={card}>
            <Text style={cardTitle}>{copy.stay}</Text>
            <Text style={row}><strong>{copy.tent}:</strong> {tentName ?? '–'}</Text>
            <Text style={row}><strong>{copy.in}:</strong> {fmtDate(checkin, l)}</Text>
            <Text style={row}><strong>{copy.out}:</strong> {fmtDate(checkout, l)}</Text>
            <Text style={row}><strong>{copy.paid}:</strong> {fmtMoney(total)}</Text>
            {paymentRef ? <Text style={row}><strong>{copy.ref}:</strong> {paymentRef}</Text> : null}
          </Section>
          {guestUrl ? <Button href={guestUrl} style={button}>{copy.guest}</Button> : null}
          <Text style={text}>{copy.footer}</Text>
          <Text style={footer}>Bergs Slussar Glamping · Göta kanal · goglampingsweden.se</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BookingConfirmation,
  subject: (d: Record<string, any>) => d?.lang === 'de'
    ? 'Ihre Buchung bei Bergs Slussar Glamping ist bestätigt'
    : d?.lang === 'en'
      ? 'Your booking at Bergs Slussar Glamping is confirmed'
      : 'Din bokning hos Bergs Slussar Glamping är bekräftad',
  displayName: 'Native bokning – bekräftelse',
  previewData: {
    guestName: 'Anna', tentName: 'Naturkärnan', checkin: '2026-08-28', checkout: '2026-08-30', total: 3490,
    paymentRef: 'GLP-ABC12345', guestToken: 'demo', lang: 'sv',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#f3f0e8', fontFamily: 'Arial, Helvetica, sans-serif', padding: '24px 0' }
const container = { backgroundColor: '#ffffff', padding: '34px', maxWidth: '580px', margin: '0 auto', borderRadius: '18px' }
const heading = { color: '#243027', fontSize: '28px', margin: '0 0 20px' }
const text = { color: '#3a4a3d', fontSize: '15px', lineHeight: '1.65' }
const card = { backgroundColor: '#f7f5ef', border: '1px solid #e5dfd1', borderRadius: '14px', padding: '18px 20px', margin: '24px 0' }
const cardTitle = { color: '#617457', fontWeight: 'bold' as const, fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }
const row = { color: '#243027', fontSize: '14px', lineHeight: '1.45', margin: '8px 0' }
const button = { backgroundColor: '#617457', color: '#ffffff', padding: '13px 22px', borderRadius: '999px', textDecoration: 'none', fontWeight: 'bold' as const }
const footer = { color: '#7d847e', fontSize: '12px', marginTop: '28px' }
