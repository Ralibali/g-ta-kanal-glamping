import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Item { name: string; quantity: number; total: number }
interface Props {
  guestName?: string
  guestEmail?: string
  guestLang?: string
  tentName?: string
  checkinDate?: string
  items?: Item[]
  total?: number
  adminUrl?: string
  hasEarlyCheckin?: boolean
  reference?: string
}

const LANG_LABELS: Record<string, string> = {
  sv: 'Svenska', en: 'Engelska', de: 'Tyska', da: 'Danska', no: 'Norska', nl: 'Nederländska', fr: 'Franska',
}

const REPLY_GREETING: Record<string, string> = {
  en: 'Hi',
  de: 'Hallo',
  da: 'Hej',
  no: 'Hei',
  nl: 'Hallo',
  fr: 'Bonjour',
}

const REPLY_BODY: Record<string, (ref: string, total: number) => string> = {
  en: (ref, total) => `,\n\nThanks for your add-on order (ref ${ref}, total ${total} SEK).\nWe will confirm your order as soon as payment has arrived.\n\nLet us know if you have any questions.\n\nWarm regards,\nBergs Slussar Glamping`,
  de: (ref, total) => `,\n\nvielen Dank für deine Zusatzbestellung (Ref. ${ref}, Gesamt ${total} SEK).\nWir bestätigen deine Bestellung, sobald die Zahlung eingegangen ist.\n\nMelde dich gern bei Fragen.\n\nHerzliche Grüße,\nBergs Slussar Glamping`,
  da: (ref, total) => `,\n\ntak for din ekstra bestilling (ref. ${ref}, i alt ${total} SEK).\nVi bekræfter din bestilling, når betalingen er modtaget.\n\nSig endelig til, hvis du har spørgsmål.\n\nMange hilsner,\nBergs Slussar Glamping`,
  no: (ref, total) => `,\n\ntakk for din tilleggsbestilling (ref. ${ref}, totalt ${total} SEK).\nVi bekrefter bestillingen når betalingen er mottatt.\n\nSi gjerne fra om du har spørsmål.\n\nVennlig hilsen,\nBergs Slussar Glamping`,
  nl: (ref, total) => `,\n\nbedankt voor je extra bestelling (ref. ${ref}, totaal ${total} SEK).\nWe bevestigen je bestelling zodra de betaling is ontvangen.\n\nLaat het ons gerust weten als je vragen hebt.\n\nMet vriendelijke groet,\nBergs Slussar Glamping`,
  fr: (ref, total) => `,\n\nmerci pour votre commande d'options (réf. ${ref}, total ${total} SEK).\nNous confirmerons votre commande dès réception du paiement.\n\nN'hésitez pas en cas de questions.\n\nBien cordialement,\nBergs Slussar Glamping`,
}

const REPLY_SUBJECT: Record<string, (ref: string) => string> = {
  en: (ref) => `Your add-on order – Bergs Slussar Glamping (ref ${ref})`,
  de: (ref) => `Deine Zusatzbestellung – Bergs Slussar Glamping (Ref. ${ref})`,
  da: (ref) => `Din ekstra bestilling – Bergs Slussar Glamping (ref. ${ref})`,
  no: (ref) => `Din tilleggsbestilling – Bergs Slussar Glamping (ref. ${ref})`,
  nl: (ref) => `Je extra bestelling – Bergs Slussar Glamping (ref. ${ref})`,
  fr: (ref) => `Votre commande d'options – Bergs Slussar Glamping (réf. ${ref})`,
}

function pickReplyLang(raw?: string): 'en' | 'de' | 'da' | 'no' | 'nl' | 'fr' {
  const l = (raw ?? 'en').toLowerCase().slice(0, 2)
  if (l === 'de' || l === 'da' || l === 'no' || l === 'nl' || l === 'fr') return l
  if (l === 'nb' || l === 'nn') return 'no'
  return 'en'
}

const Email = ({
  guestName, guestEmail, guestLang, tentName, checkinDate,
  items = [], total = 0, adminUrl, hasEarlyCheckin, reference,
}: Props) => {
  const lang = (guestLang ?? 'sv').toLowerCase().slice(0, 2)
  const isSv = lang === 'sv'
  const langLabel = LANG_LABELS[lang] ?? guestLang ?? '—'
  const ref = reference ?? '—'

  let mailtoHref: string | null = null
  if (!isSv && guestEmail) {
    const rl = pickReplyLang(guestLang)
    const greeting = REPLY_GREETING[rl] ?? 'Hi'
    const subject = REPLY_SUBJECT[rl](ref)
    const body = `${greeting} ${guestName?.split(',').pop()?.trim().split(' ')[0] ?? ''}${REPLY_BODY[rl](ref, total)}`
    mailtoHref = `mailto:${guestEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <Html lang="sv" dir="ltr">
      <Head />
      <Preview>Nytt tillvalsönskemål från {guestName ?? 'gäst'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🛎️ Nytt tillvalsönskemål</Heading>
          <Section style={card}>
            <Text style={label}>Gäst</Text>
            <Text style={value}>{guestName ?? '—'}{guestEmail ? ` • ${guestEmail}` : ''}</Text>
            <Text style={label}>Språk</Text>
            <Text style={value}>{langLabel}</Text>
            <Text style={label}>Tält / incheckning</Text>
            <Text style={value}>{tentName ?? '—'} • {checkinDate ?? '—'}</Text>
            <Text style={label}>Referens</Text>
            <Text style={value}>{ref}</Text>
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

          {isSv ? (
            <Section style={swishCallout}>
              <Text style={text}><strong>Svensk gäst</strong> – får Swish-instruktioner automatiskt. Bekräfta beställningen i admin när betalningen kommit in.</Text>
            </Section>
          ) : (
            <Section style={payCallout}>
              <Text style={text}><strong>Utländsk gäst</strong> – gästen har fått ett mejl om att betalningsinstruktioner kommer. Följ upp manuellt vid behov och bekräfta i admin när betalningen kommit in.</Text>
              {mailtoHref && (
                <>
                  <Button href={mailtoHref} style={button}>✉️ Svara gästen</Button>
                  <Text style={helpText}>Öppnar din mejlklient med ett färdigt svar på {langLabel.toLowerCase()}.</Text>
                </>
              )}
              {!guestEmail && (
                <Text style={helpText}>OBS! Gästen saknar e-postadress – kontakta dem manuellt.</Text>
              )}
            </Section>
          )}

          {adminUrl && <Text style={text}><a href={adminUrl} style={link}>Öppna admin →</a></Text>}
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => {
    const flag = (d?.guestLang ?? 'sv').toLowerCase().startsWith('sv') ? '🇸🇪' : '🌍'
    return `${flag} Tillvalsönskemål: ${d?.guestName ?? 'gäst'} – ${d?.tentName ?? ''}`
  },
  displayName: 'Tillvalsönskemål – ägarnotis',
  previewData: {
    guestName: 'Anna Müller', guestEmail: 'anna@example.com', guestLang: 'de',
    tentName: 'Naturkärnan', checkinDate: '2026-07-15',
    items: [{ name: 'Breakfast ×2', quantity: 2, total: 418 }],
    total: 418, hasEarlyCheckin: false, reference: 'BOK-1234',
    adminUrl: 'https://goglampingsweden.se/admin/addon-orders',
  },
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
const swishCallout = { backgroundColor: '#f4f7f1', border: '1px solid #d4e0c9', borderRadius: '8px', padding: '14px 18px', margin: '12px 0' }
const payCallout = { backgroundColor: '#eef4ff', border: '1px solid #c5d8f5', borderRadius: '8px', padding: '14px 18px', margin: '12px 0' }
const button = { backgroundColor: '#2c5f2e', color: '#ffffff', padding: '12px 22px', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block', margin: '10px 0' }
const helpText = { fontSize: '13px', color: '#555', fontStyle: 'italic' as const, margin: '8px 0 0' }
const link = { color: '#2c5f2e', textDecoration: 'underline' }
