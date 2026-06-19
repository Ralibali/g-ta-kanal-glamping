import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Bergs Slussar Glamping'

interface Props {
  guestName?: string | null
  tentName?: string
  tentNo?: number
  breakfast?: boolean
  fikapase?: boolean
  lang?: string
}

const COPY = {
  sv: {
    preview: (t: string) => `Välkommen! Ditt tält ${t} är klart för incheckning`,
    h1: (t: string) => `Välkommen till oss på ${SITE_NAME}! ☀️`,
    body: (name: string | null | undefined, breakfast: boolean, fikapase: boolean) => [
      `${name ? `Hej ${name}` : 'Hej'} och välkommen!`,
      'Våra städare har markerat erat tält som klart, vilket gör att ni är välkomna från nu. Ni checkar in via QR-koden som finns vid entrén och därigenom så får ni koden till erat tält. Bokningskoden hittar du i din mail.',
      breakfast ? 'Frukost serveras mellan 08:30–09:00 och finns vid portalen halvvägs upp i backen.' : null,
      fikapase ? 'Er fikapåse står redo i tältet!' : null,
      'Har ni några frågor? Hör av er till Christoffer per SMS på 0722254993.',
      'Vänligen,\nBergs Slussar Glamping 🏕️',
    ].filter(Boolean) as string[],
  },
  en: {
    preview: (t: string) => `Welcome! Your tent ${t} is ready for check-in`,
    h1: () => `Welcome to ${SITE_NAME}! ☀️`,
    body: (name: string | null | undefined, breakfast: boolean, fikapase: boolean) => [
      `${name ? `Hi ${name}` : 'Hi'} and welcome!`,
      'Our cleaners have marked your tent as ready, so you are welcome to check in from now. Please check in via the QR code at the entrance — you will then receive the code to your tent. Your booking number is in your email.',
      breakfast ? 'Breakfast is served between 08:30–09:00 at the portal halfway up the hill.' : null,
      fikapase ? 'Your coffee/snack bag (fikapåse) is ready in your tent!' : null,
      'Any questions? Text Christoffer on +46 722 25 49 93.',
      'Kind regards,\nBergs Slussar Glamping 🏕️',
    ].filter(Boolean) as string[],
  },
} as const

const TentReadyGuestEmail = ({ guestName, tentName, tentNo, breakfast, fikapase, lang }: Props) => {
  const l = (lang ?? 'sv').toLowerCase().startsWith('sv') ? 'sv' : 'en'
  const c = COPY[l]
  const tentLabel = `${tentNo ?? ''} – ${tentName ?? ''}`.trim()
  return (
    <Html lang={l} dir="ltr">
      <Head />
      <Preview>{c.preview(tentLabel)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{c.h1(tentLabel)}</Heading>
          <Section style={card}>
            <Text style={label}>{l === 'sv' ? 'Ert tält' : 'Your tent'}</Text>
            <Text style={value}>Tält {tentNo} – {tentName}</Text>
          </Section>
          {c.body(guestName, !!breakfast, !!fikapase).map((p, i) => (
            <Text key={i} style={text}>{p}</Text>
          ))}
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TentReadyGuestEmail,
  subject: (d: Record<string, any>) => {
    const l = (d?.lang ?? 'sv').toLowerCase().startsWith('sv') ? 'sv' : 'en'
    return l === 'sv'
      ? `Välkommen! Ditt tält är klart 🏕️`
      : `Welcome! Your tent is ready 🏕️`
  },
  displayName: 'Tält klart – välkomst till gäst',
  previewData: {
    guestName: 'Anna', tentName: 'Naturkärnan', tentNo: 2, breakfast: true, fikapase: false, lang: 'sv',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#2c5f2e', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.65', margin: '12px 0', whiteSpace: 'pre-line' as const }
const card = { backgroundColor: '#f7f5ef', border: '1px solid #ece7d8', borderRadius: '8px', padding: '14px 18px', margin: '0 0 12px' }
const label = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#8a8a8a', margin: '0 0 4px' }
const value = { fontSize: '15px', color: '#1a1a1a', margin: 0 }
