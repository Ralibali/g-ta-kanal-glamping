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
    heading: '🌿 Snart dags!',
    intro: (name: string, days: string, tent: string) =>
      `Hej ${name}! Om ${days} dagar checkar du in i ${tent} vid Göta kanal. Vill du göra vistelsen lite extra?`,
    items: (b: number, f: number, e: number, l: number) => [
      `🥐 Frukost – bakad och levererad av Boställets Vedugnsbageri, ställs vid portalen runt kl 08:30. Ni får ett SMS så fort den är på plats (${b} kr/person)`,
      `☕ Fikapåse – något gott som väntar i tältet vid ankomst (${f} kr)`,
      `🕛 Tidig incheckning kl 12:00 istället för kl 15:00 (${e} kr)`,
      `🕛 Sen utcheckning till kl 12:00 istället för kl 10:00 (${l} kr)`,
    ],
    cta: 'Lägg till tillval',
    outro: 'Vi ses snart!',
    signoff: 'Bergs Slussar Glamping',
  },
  en: {
    preview: (t: string) => `Almost time! Prepare your stay in ${t}`,
    subject: 'Almost time! Prepare your stay 🌿',
    heading: '🌿 Almost time!',
    intro: (name: string, days: string, tent: string) =>
      `Hi ${name}! In ${days} days you check in to ${tent} by the Göta Canal. Want to make your stay a little extra?`,
    items: (b: number, f: number, e: number, l: number) => [
      `🥐 Breakfast – baked and delivered by Boställets Vedugnsbageri, placed at the portal around 8:30. You'll get a text as soon as it's ready (${b} SEK/person)`,
      `☕ Fika bag – a sweet treat waiting in your tent on arrival (${f} SEK)`,
      `🕛 Early check-in at 12:00 instead of 15:00 (${e} SEK)`,
      `🕛 Late check-out until 12:00 instead of 10:00 (${l} SEK)`,
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
          {c.items(breakfastPrice, fikaPrice, earlyPrice, latePrice).map((it, i) => (
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
