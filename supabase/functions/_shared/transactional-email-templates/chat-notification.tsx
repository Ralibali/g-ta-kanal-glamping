import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Bergs Slussar Glamping'

interface ChatNotificationProps {
  visitorName?: string
  visitorEmail?: string
  messageBody?: string
  adminUrl?: string
}

const ChatNotificationEmail = ({
  visitorName,
  visitorEmail,
  messageBody,
  adminUrl,
}: ChatNotificationProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>
      Nytt chattmeddelande från {visitorName || 'en gäst'} på {SITE_NAME}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nytt chattmeddelande</Heading>
        <Text style={text}>
          Du har fått ett nytt meddelande via chatten på {SITE_NAME}.
        </Text>

        <Section style={card}>
          <Text style={label}>Från</Text>
          <Text style={value}>
            {visitorName || 'Okänd gäst'}{' '}
            {visitorEmail ? <span style={muted}>&lt;{visitorEmail}&gt;</span> : null}
          </Text>

          <Text style={label}>Meddelande</Text>
          <Text style={message}>{messageBody || '(tomt meddelande)'}</Text>
        </Section>

        {adminUrl ? (
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={adminUrl} style={button}>
              Öppna chatten i admin
            </Button>
          </Section>
        ) : null}

        <Text style={footer}>
          Du får detta mail eftersom du är administratör för {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ChatNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Nytt chattmeddelande från ${data?.visitorName || 'en gäst'}`,
  displayName: 'Chattnotis till admin',
  to: 'info@auroramedia.se',
  previewData: {
    visitorName: 'Anna Andersson',
    visitorEmail: 'anna@example.com',
    messageBody: 'Hej! Finns det lediga tält helgen 12–14 juli?',
    adminUrl: 'https://goglampingsweden.se/admin/chat',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#2c5f2e', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#4a4a4a', lineHeight: '1.6', margin: '0 0 20px' }
const card = {
  backgroundColor: '#f7f5ef',
  border: '1px solid #ece7d8',
  borderRadius: '8px',
  padding: '18px 20px',
  margin: '0 0 8px',
}
const label = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#8a8a8a', margin: '12px 0 4px' }
const value = { fontSize: '15px', color: '#1a1a1a', margin: '0 0 8px' }
const muted = { color: '#8a8a8a', fontWeight: 'normal' as const }
const message = { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const, margin: '0' }
const button = {
  backgroundColor: '#2c5f2e',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '999px',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }
