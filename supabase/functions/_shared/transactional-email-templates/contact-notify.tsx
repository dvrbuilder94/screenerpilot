import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ScreenerPilot'

interface ContactNotifyProps {
  fromName?: string
  fromEmail?: string
  message?: string
}

const ContactNotifyEmail = ({ fromName, fromEmail, message }: ContactNotifyProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact message from {fromName || fromEmail || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New contact message</Heading>
        <Text style={label}>From</Text>
        <Text style={value}>
          {fromName ? `${fromName} ` : ''}&lt;{fromEmail || 'unknown'}&gt;
        </Text>
        <Hr style={hr} />
        <Text style={label}>Message</Text>
        <Section style={messageBox}>
          <Text style={messageText}>{message || '(no message)'}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Sent from the {SITE_NAME} contact form.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotifyEmail,
  subject: (data: Record<string, any>) =>
    `[${SITE_NAME}] Contact: ${data?.fromName || data?.fromEmail || 'new message'}`,
  displayName: 'Contact form notification',
  previewData: {
    fromName: 'Jane Doe',
    fromEmail: 'jane@example.com',
    message: 'Hi! I have a question about your product.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '20px', fontWeight: 'bold', color: '#111111', margin: '0 0 20px' }
const label = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#888888', margin: '16px 0 4px' }
const value = { fontSize: '14px', color: '#111111', margin: '0' }
const messageBox = { backgroundColor: '#f5f5f5', borderRadius: '6px', padding: '14px 16px', margin: '4px 0 0' }
const messageText = { fontSize: '14px', color: '#111111', lineHeight: '1.55', margin: '0', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#eeeeee', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
