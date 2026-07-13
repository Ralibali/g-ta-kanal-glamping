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
    preview: 'Payment instructions — your order is reserved',
    subject: 'Thank you! Payment instructions 🌿',
    heading: 'Thank you for your order!',
    intro: (name: string, tent: string) =>
      `Hi ${name}! We've received your extras for ${tent}. We'll send payment instructions and confirm your order as soon as payment has arrived. Your order is reserved until then.`,
    summary: 'Summary',
    total: (t: number) => `Total to pay: ${t} SEK`,
    payTitle: 'How payment works',
    payText: 'We will send payment instructions from info@auroramedia.se. Once payment has arrived, we confirm your order manually.',
    refLine: (r: string) => `Reference: ${r}`,
    outro: 'See you soon!',
    signoff: 'Bergs Slussar Glamping',
    kr: 'SEK',
  },
  de: {
    preview: 'Zahlungsinformationen — deine Bestellung ist reserviert',
    subject: 'Danke! Zahlungsinformationen folgen 🌿',
    heading: 'Danke für deine Bestellung!',
    intro: (name: string, tent: string) =>
      `Hallo ${name}! Wir haben deine Extras für ${tent} erhalten. Du erhältst Zahlungsinformationen und wir bestätigen deine Bestellung, sobald die Zahlung eingegangen ist. Deine Bestellung ist bis dahin reserviert.`,
    summary: 'Übersicht',
    total: (t: number) => `Gesamtbetrag: ${t} SEK`,
    payTitle: 'So funktioniert die Zahlung',
    payText: 'Du erhältst Zahlungsinformationen von info@auroramedia.se. Sobald die Zahlung eingegangen ist, bestätigen wir deine Bestellung manuell.',
    refLine: (r: string) => `Referenz: ${r}`,
    outro: 'Bis bald!',
    signoff: 'Bergs Slussar Glamping',
    kr: 'SEK',
  },
  da: {
    preview: 'Betalingsinstruktioner — din bestilling er reserveret',
    subject: 'Tak! Betalingsinstruktioner kommer snart 🌿',
    heading: 'Tak for din bestilling!',
    intro: (name: string, tent: string) =>
      `Hej ${name}! Vi har modtaget dine ekstra ydelser til ${tent}. Du får betalingsinstruktioner, og vi bekræfter din bestilling, når betalingen er modtaget. Din bestilling er reserveret indtil da.`,
    summary: 'Oversigt',
    total: (t: number) => `Total: ${t} SEK`,
    payTitle: 'Sådan fungerer betaling',
    payText: 'Du får betalingsinstruktioner fra info@auroramedia.se. Når betalingen er modtaget, bekræfter vi din bestilling manuelt.',
    refLine: (r: string) => `Reference: ${r}`,
    outro: 'Vi ses snart!',
    signoff: 'Bergs Slussar Glamping',
    kr: 'SEK',
  },
  no: {
    preview: 'Betalingsinstruksjoner — bestillingen er reservert',
    subject: 'Takk! Betalingsinstruksjoner kommer snart 🌿',
    heading: 'Takk for bestillingen din!',
    intro: (name: string, tent: string) =>
      `Hei ${name}! Vi har mottatt dine tillegg til ${tent}. Du får betalingsinstruksjoner, og vi bekrefter bestillingen når betalingen er mottatt. Bestillingen er reservert til da.`,
    summary: 'Oversikt',
    total: (t: number) => `Total: ${t} SEK`,
    payTitle: 'Slik fungerer betalingen',
    payText: 'Du får betalingsinstruksjoner fra info@auroramedia.se. Når betalingen er mottatt, bekrefter vi bestillingen manuelt.',
    refLine: (r: string) => `Referanse: ${r}`,
    outro: 'Vi ses snart!',
    signoff: 'Bergs Slussar Glamping',
    kr: 'SEK',
  },
  nl: {
    preview: 'Betaalinstructies — je bestelling is gereserveerd',
    subject: 'Bedankt! Betaalinstructies komen eraan 🌿',
    heading: 'Bedankt voor je bestelling!',
    intro: (name: string, tent: string) =>
      `Hallo ${name}! We hebben je extra's voor ${tent} ontvangen. Je ontvangt betaalinstructies en we bevestigen je bestelling zodra de betaling is ontvangen. Je bestelling is tot dan gereserveerd.`,
    summary: 'Overzicht',
    total: (t: number) => `Totaal: ${t} SEK`,
    payTitle: 'Zo werkt het betalen',
    payText: 'Je ontvangt betaalinstructies van info@auroramedia.se. Zodra de betaling is ontvangen, bevestigen we je bestelling handmatig.',
    refLine: (r: string) => `Referentie: ${r}`,
    outro: 'Tot snel!',
    signoff: 'Bergs Slussar Glamping',
    kr: 'SEK',
  },
  fr: {
    preview: 'Instructions de paiement — votre commande est réservée',
    subject: 'Merci ! Instructions de paiement à venir 🌿',
    heading: 'Merci pour votre commande !',
    intro: (name: string, tent: string) =>
      `Bonjour ${name} ! Nous avons reçu vos options pour ${tent}. Vous recevrez les instructions de paiement et nous confirmerons votre commande dès réception du paiement. Votre commande est réservée d'ici là.`,
    summary: 'Récapitulatif',
    total: (t: number) => `Total à payer : ${t} SEK`,
    payTitle: 'Comment fonctionne le paiement',
    payText: 'Vous recevrez les instructions de paiement depuis info@auroramedia.se. Dès réception du paiement, nous confirmerons votre commande manuellement.',
    refLine: (r: string) => `Référence : ${r}`,
    outro: 'À très bientôt !',
    signoff: 'Bergs Slussar Glamping',
    kr: 'SEK',
  },
} as const

type LangKey = keyof typeof COPY
function pickLang(raw: string | undefined): LangKey {
  const l = (raw ?? 'sv').toLowerCase().slice(0, 2)
  if (l in COPY) return l as LangKey
  if (l === 'nb' || l === 'nn') return 'no'
  return 'en'
}

const Email = ({
  firstName, tentName, items = [], total = 0, lang,
  swishNumber = '1230628289', swishPayee = 'Aurora Media AB', swishReference = '',
}: Props) => {
  const l = pickLang(lang)
  const c = COPY[l]
  const isSv = l === 'sv'
  const name = firstName || (isSv ? 'där' : l === 'de' ? 'du' : l === 'fr' ? 'cher client' : 'there')
  const tent = tentName || (isSv ? 'ert tält' : l === 'de' ? 'dein Zelt' : l === 'fr' ? 'votre tente' : 'your tent')
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

          {isSv ? (
            <Section style={swishBox}>
              <Heading as="h2" style={h2}>{(c as typeof COPY.sv).swishTitle}</Heading>
              <Text style={kv}><strong>{(c as typeof COPY.sv).swishNumber}:</strong> {swishNumber}</Text>
              <Text style={kv}><strong>{(c as typeof COPY.sv).swishPayee}:</strong> {swishPayee}</Text>
              <Text style={kv}><strong>{(c as typeof COPY.sv).swishAmount}:</strong> {total} {c.kr}</Text>
              <Text style={kv}><strong>{(c as typeof COPY.sv).swishRef}:</strong> {swishReference}</Text>
              <Text style={helpText}>{(c as typeof COPY.sv).swishHelp}</Text>
              <Button href={swishUrl} style={button}>{(c as typeof COPY.sv).openSwish}</Button>
            </Section>
          ) : (
            <Section style={payBox}>
              <Heading as="h2" style={h2}>{(c as typeof COPY.en).payTitle}</Heading>
              <Text style={text}>{(c as typeof COPY.en).payText}</Text>
              <Text style={kv}>{(c as typeof COPY.en).refLine(swishReference)}</Text>
            </Section>
          )}

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
    const l = pickLang(d?.lang)
    return COPY[l].subject
  },
  displayName: 'Tillvalsbeställning – gästbekräftelse',
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
const payBox = { backgroundColor: '#f4f7f1', border: '1px solid #d4e0c9', borderRadius: '8px', padding: '18px 20px', margin: '8px 0 20px' }
const kv = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.55', margin: '4px 0' }
const helpText = { fontSize: '13px', color: '#555', fontStyle: 'italic' as const, margin: '10px 0 14px' }
const button = { backgroundColor: '#2c5f2e', color: '#ffffff', padding: '12px 22px', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const signoff = { fontSize: '15px', color: '#2c5f2e', fontWeight: 'bold' as const, marginTop: '12px' }
