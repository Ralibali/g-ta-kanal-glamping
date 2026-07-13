import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  firstName?: string | null
  tentName?: string
  checkinDate?: string
  checkoutDate?: string
  nights?: number
  daysWord?: string
  breakfastPrice?: number
  fikaPrice?: number
  earlyPrice?: number
  latePrice?: number
  link?: string
  lang?: string
}

const COPY = {
  sv: {
    preview: (t: string) => `Snart dags! Förbered din vistelse i ${t}`,
    subject: 'Snart dags! Förbered din vistelse 🌿',
    heading: 'Välkomna till Bergs Slussar Glamping',
    intro: (name: string, days: string, tent: string) =>
      `Hej ${name}! Om ${days} dagar checkar du in i ${tent} vid Göta kanal. Vad roligt att ni snart kommer till oss vid kanalen!`,
    lead: 'Här är allt ni behöver inför vistelsen. Vill ni förgylla vistelsen? Lägg till frukost eller mer tid vid kanalen nedan.',
    payment: 'Du betalar tryggt med kort i nästa steg — vi bekräftar direkt när betalningen är genomförd.',
    items: (b: number, e: number, l: number) => [
      `Frukost — ${b} kr/person. Nybakat och närproducerat från Boställets Vedugnsbageri: fröbulle med smör, ost, sallad och skinka, hårdkokt ägg, naturell yoghurt med hemlagad müsli och säsongens frukt, hembakad småkaka och juice. Kaffe finns i tältet för egen servering. Frukosten ställs vid portalen ca kl 08:30 — vi skickar SMS så fort den är på plats.`,
      `Tidig incheckning kl 12:00 — ${e} kr. Kom redan kl 12:00 istället för ordinarie kl 15:00 — tre extra timmar att njuta vid kanalen.`,
      `Sen utcheckning till kl 12:00 — ${l} kr. Stanna kvar till klockan tolv istället för tio — ingen stress på avresemorgonen.`,
    ],
    cta: 'Lägg till tillval',
    outro: 'Vi ses snart!',
    signoff: 'Bergs Slussar Glamping',
  },
  en: {
    preview: (t: string) => `Almost time! Prepare your stay in ${t}`,
    subject: 'Almost time! Prepare your stay 🌿',
    heading: 'Welcome to Bergs Slussar Glamping',
    intro: (name: string, days: string, tent: string) =>
      `Hi ${name}! In ${days} days you check in to ${tent} by the Göta Canal. We're so happy you're coming to stay with us by the canal!`,
    lead: 'Here is everything you need before your stay. Want to make it even better? Add breakfast or more time by the canal below.',
    payment: 'You pay securely by card in the next step — we confirm as soon as the payment is complete.',
    items: (b: number, e: number, l: number) => [
      `Breakfast — ${b} SEK/person. Fresh and locally baked by Boställets Vedugnsbageri: seed roll with butter, cheese, lettuce and ham, hard-boiled egg, plain yoghurt with homemade muesli and seasonal fruit, homemade cookie and juice. Coffee is available in the tent for self-service. Breakfast is placed at the portal around 8:30 — we text you as soon as it is there.`,
      `Early check-in at 12:00 — ${e} SEK. Arrive at 12:00 instead of 15:00 — three extra hours by the canal.`,
      `Late check-out until 12:00 — ${l} SEK. Stay until noon instead of 10:00 — no stress on departure morning.`,
    ],
    cta: 'Add extras',
    outro: 'See you soon!',
    signoff: 'Bergs Slussar Glamping',
  },
} as const

const Email = ({
  firstName, tentName, daysWord = 'fem', breakfastPrice = 209, fikaPrice = 89, earlyPrice = 399, latePrice = 399,
  link = 'https://goglampingsweden.se', lang,
}: Props) => {
  const l = (lang ?? 'sv').toLowerCase().startsWith('en') ? 'en' : 'sv'
  const c = COPY[l]
  const name = firstName || (l === 'sv' ? 'där' : 'there')
  const tent = tentName || (l === 'sv' ? 'ert tält' : 'your tent')
  return (
    <Html lang={l} dir="ltr">
      <Head />
      <Preview>{c.preview(tent)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{c.heading}</Heading>
          <Text style={text}>{c.intro(name, daysWord, tent)}</Text>
          <Text style={text}>{c.lead}</Text>
          <Text style={text}>{c.payment}</Text>
          {c.items(breakfastPrice, earlyPrice, latePrice).map((it, i) => (
            <Text key={i} style={item}>{it}</Text>
          ))}
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={link} style={button}>{c.cta}</Button>
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
  displayName: 'Förankomst – tillvalsmeny',
  previewData: { firstName: 'Anna', tentName: 'Naturkärnan', daysWord: 'fem', breakfastPrice: 209, fikaPrice: 89, earlyPrice: 399, latePrice: 399, link: 'https://goglampingsweden.se/stay/abc', lang: 'sv' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2c5f2e', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.65', margin: '12px 0' }
const item = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.6', margin: '8px 0', paddingLeft: '4px' }
const button = { backgroundColor: '#2c5f2e', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', textDecoration: 'none', fontSize: '15px', fontWeight: 'bold' as const, display: 'inline-block' }
const signoff = { fontSize: '15px', color: '#2c5f2e', fontWeight: 'bold' as const, marginTop: '20px' }
