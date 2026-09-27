import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  email?: string
  message?: string
  sourcePage?: string
}

const Email = ({ name, email, message, sourcePage }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New solar help request from {name || 'a resident'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New solar help request</Heading>
        <Text style={text}><b>Name:</b> {name || '—'}</Text>
        <Text style={text}><b>Email:</b> {email || '—'}</Text>
        {sourcePage ? <Text style={text}><b>Page:</b> {sourcePage}</Text> : null}
        <Hr style={hr} />
        <Text style={text}>{message || '(no message)'}</Text>
        <Hr style={hr} />
        <Text style={footer}>Austin Clean Energy · austincleanenergy.net</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Solar help request from ${d?.name || 'a resident'}`,
  displayName: 'Solar help request (admin alert)',
  previewData: { name: 'Jane Doe', email: 'jane@example.com', message: 'Can you help me compare quotes?', sourcePage: '/property-assessment' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Work Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { color: '#163F32', fontSize: '22px', margin: '0 0 16px' }
const text = { color: '#1f2937', fontSize: '15px', lineHeight: '1.5', margin: '0 0 8px' }
const hr = { borderColor: '#DCEBE4', margin: '16px 0' }
const footer = { color: '#2A7656', fontSize: '12px' }
