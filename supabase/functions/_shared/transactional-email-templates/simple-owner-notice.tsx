/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { subject?: string; body?: string }

const Email = ({ subject = 'Ny händelse', body = '' }: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{subject}</Heading>
        <Text style={pre}>{body}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => String(d?.subject ?? 'Ny händelse'),
  displayName: 'Enkel adminnotis',
  previewData: { subject: 'Test', body: 'Detta är ett test.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '20px', color: '#2c5f2e', margin: '0 0 16px' }
const pre = { whiteSpace: 'pre-wrap' as const, color: '#333', fontSize: '14px', lineHeight: '22px' }
