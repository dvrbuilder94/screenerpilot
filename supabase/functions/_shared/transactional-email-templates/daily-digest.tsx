import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ScreenerPilot'
const SITE_URL = 'https://screenerpilot.com'

interface DailyDigestProps {
  headline?: string
  contentMd?: string
  dateLabel?: string
}

// The briefing body only ever uses **bold** — split on it and render <strong>
// instead of pulling in a full markdown renderer for a two-paragraph email.
function renderBoldText(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? React.createElement('strong', { key: i }, part) : part,
  )
}

const DailyDigestEmail = ({ headline, contentMd, dateLabel }: DailyDigestProps) => {
  const paragraphs = (contentMd || '')
    .split(/\n{2,}/)
    .map((p) => p.replace(/^\*\*TL;DR\s*[—:-]\*\*\s*/i, '').trim())
    .filter(Boolean)

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{headline || `${SITE_NAME} morning wire`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={kicker}>BEN · MORNING WIRE{dateLabel ? ` · ${dateLabel}` : ''}</Text>
          <Heading style={h1}>{headline || 'Morning Wire'}</Heading>
          <Hr style={hr} />
          {paragraphs.map((p, i) => (
            <Text key={i} style={body}>{renderBoldText(p)}</Text>
          ))}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${SITE_URL}/markets`}>
              Open today&apos;s full wire
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            You&apos;re getting this because you&apos;re signed up for the {SITE_NAME} daily digest.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: DailyDigestEmail,
  subject: (data: Record<string, any>) =>
    data?.headline ? `${data.headline} — ${SITE_NAME}` : `${SITE_NAME} Morning Wire`,
  displayName: 'Daily market digest',
  previewData: {
    headline: 'Dollar slips as risk-on tone builds into the close',
    contentMd:
      "**TL;DR —** Risk-on tone builds as the dollar slips and small caps lead.\n\nUS equities push higher into the close, led by **small caps** up 1.4% on the day. The dollar index slips 0.3% as Treasury yields ease, with the 10-year back below 4.2%. Crude oil holds flat near 78 a barrel while Bitcoin adds 2.1% to retake 64,000. Cross-asset signals lean constructive: risk-on, broadening participation.",
    dateLabel: 'Mon, 20 Jun 2026',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const kicker = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#d97706', fontWeight: 'bold' as const, margin: '0 0 8px' }
const h1 = { fontSize: '20px', fontWeight: 'bold', color: '#111111', margin: '0 0 16px', lineHeight: '1.35' }
const body = { fontSize: '14px', color: '#222222', lineHeight: '1.65', margin: '0 0 14px' }
const hr = { borderColor: '#eeeeee', margin: '20px 0' }
const ctaSection = { margin: '8px 0 4px' }
const ctaButton = { backgroundColor: '#111111', color: '#ffffff', fontSize: '13px', fontWeight: 'bold' as const, padding: '11px 20px', borderRadius: '6px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
