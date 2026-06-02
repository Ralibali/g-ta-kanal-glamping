import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Bergs Slussar Glamping'

interface ChatReplyProps {
  visitorName?: string
  replyBody?: string
  chatUrl?: string
}

const ChatReplyEmail = ({ visitorName, replyBody, chatUrl }: ChatReplyProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Du har fått ett svar från {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {visitorName ? `Hej ${visitorName}!` : 'Hej!'}
        </Heading>
        <Text style={text}>
          Du har fått ett nytt svar på din chatt med {SITE_NAME}.
        </Text>

        <Section style={card}>
          <Text style={message}>{replyBody || '(tomt meddelande)'}</Text>
        </Section>

        {chatUrl ? (
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={chatUrl} style={button}>
              Öppna chatten och svara
            </Button>
          </Section>
        ) : null}

        <Text style={footer}>Vänliga hälsningar, {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ChatReplyEmail,
  subject: `Nytt svar från ${SITE_NAME}`,
  displayName: 'Chattsvar till gäst',
  previewData: {
    visitorName: 'Anna',
    replyBody: 'Hej Anna! Ja vi har lediga tält den helgen. Vill du att jag bokar?',
    chatUrl: 'https://goglampingsweden.se/chat?token=demo',
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
