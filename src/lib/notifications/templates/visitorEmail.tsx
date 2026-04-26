import 'server-only'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Hr,
  Preview,
  Button,
} from '@react-email/components'
import type { EstimationResult } from '@/lib/types'
import type { Lead } from '@prisma/client'
import { formatCurrency } from '@/lib/utils/format'
import { Locale, Currency, ComplexityLevel, LOCALE_BCP47_MAP } from '@/lib/enums'

// Locales suportados pelo sistema (Locale enum usa underscore: pt_BR)
type SupportedLocale = 'pt_BR' | 'en_US' | 'es_ES' | 'it_IT'

interface VisitorEmailStrings {
  greeting: string
  intro: string
  estimateTitle: string
  investment: string
  timeline: string
  daysUnit: string
  complexity: string
  complexityLevels: Record<ComplexityLevel, string>
  scopeStoryTitle: string
  nextSteps: string
  nextStepsBody: string
  ctaLabel: string
  footer: string
  footerAuto: string
  privacyNotice: string
  rightsInfo: string
  // CL-232: unsubscribe label (optional for backward compat)
  unsubscribeLabel?: string
}

// Strings i18n para NOTIF-003 — GDPR minimization: sem Q&A detalhado
const VISITOR_EMAIL_STRINGS: Record<SupportedLocale, VisitorEmailStrings> = {
  pt_BR: {
    greeting: 'Olá, {name}! 👋',
    intro:
      'Recebemos suas respostas e preparamos uma estimativa personalizada para o seu projeto.',
    estimateTitle: '💰 Sua Estimativa',
    investment: 'Investimento estimado:',
    timeline: 'Prazo estimado:',
    daysUnit: 'dias úteis',
    complexity: 'Complexidade:',
    complexityLevels: {
      [ComplexityLevel.LOW]: 'Baixa',
      [ComplexityLevel.MEDIUM]: 'Média',
      [ComplexityLevel.HIGH]: 'Alta',
      [ComplexityLevel.VERY_HIGH]: 'Muito Alta',
    },
    scopeStoryTitle: '📖 Seu Projeto em Palavras',
    nextSteps: '📬 Próximos Passos',
    nextStepsBody:
      'Em breve nossa equipe entrará em contato para discutir os detalhes do seu projeto e apresentar uma proposta completa.',
    ctaLabel: 'Ver meu orçamento',
    footer: 'Budget Free Engine',
    footerAuto:
      'Este email foi gerado automaticamente. Para dúvidas, responda este email.',
    privacyNotice:
      'Você recebeu este email porque preencheu o formulário de orçamento.',
    rightsInfo:
      'Para exercer seus direitos (LGPD Art. 18): contato via email.',
    unsubscribeLabel: 'Cancelar inscrição',
  },
  en_US: {
    greeting: 'Hello, {name}! 👋',
    intro:
      'We received your answers and prepared a personalized estimate for your project.',
    estimateTitle: '💰 Your Estimate',
    investment: 'Estimated investment:',
    timeline: 'Estimated timeline:',
    daysUnit: 'business days',
    complexity: 'Complexity:',
    complexityLevels: {
      [ComplexityLevel.LOW]: 'Low',
      [ComplexityLevel.MEDIUM]: 'Medium',
      [ComplexityLevel.HIGH]: 'High',
      [ComplexityLevel.VERY_HIGH]: 'Very High',
    },
    scopeStoryTitle: '📖 Your Project in Words',
    nextSteps: '📬 Next Steps',
    nextStepsBody:
      'Our team will be in touch soon to discuss your project details and present a full proposal.',
    ctaLabel: 'View my estimate',
    footer: 'Budget Free Engine',
    footerAuto:
      'This email was generated automatically. To contact us, reply to this email.',
    privacyNotice:
      'You received this email because you submitted an estimate form.',
    rightsInfo:
      'To exercise your rights (GDPR Arts. 15-22): contact us via email.',
    unsubscribeLabel: 'Unsubscribe',
  },
  es_ES: {
    greeting: '¡Hola, {name}! 👋',
    intro:
      'Recibimos tus respuestas y preparamos un presupuesto personalizado para tu proyecto.',
    estimateTitle: '💰 Tu Presupuesto',
    investment: 'Inversión estimada:',
    timeline: 'Plazo estimado:',
    daysUnit: 'días hábiles',
    complexity: 'Complejidad:',
    complexityLevels: {
      [ComplexityLevel.LOW]: 'Baja',
      [ComplexityLevel.MEDIUM]: 'Media',
      [ComplexityLevel.HIGH]: 'Alta',
      [ComplexityLevel.VERY_HIGH]: 'Muy Alta',
    },
    scopeStoryTitle: '📖 Tu Proyecto en Palabras',
    nextSteps: '📬 Próximos Pasos',
    nextStepsBody:
      'Nuestro equipo se pondrá en contacto pronto para discutir los detalles y presentar una propuesta completa.',
    ctaLabel: 'Ver mi presupuesto',
    footer: 'Budget Free Engine',
    footerAuto:
      'Este correo fue generado automáticamente. Para consultas, responde este email.',
    privacyNotice:
      'Recibiste este correo porque completaste el formulario de presupuesto.',
    rightsInfo:
      'Para ejercer tus derechos (GDPR Arts. 15-22): contacto vía email.',
    unsubscribeLabel: 'Darse de baja',
  },
  it_IT: {
    greeting: 'Ciao, {name}! 👋',
    intro:
      'Abbiamo ricevuto le tue risposte e preparato un preventivo personalizzato per il tuo progetto.',
    estimateTitle: '💰 Il Tuo Preventivo',
    investment: 'Investimento stimato:',
    timeline: 'Tempi stimati:',
    daysUnit: 'giorni lavorativi',
    complexity: 'Complessità:',
    complexityLevels: {
      [ComplexityLevel.LOW]: 'Bassa',
      [ComplexityLevel.MEDIUM]: 'Media',
      [ComplexityLevel.HIGH]: 'Alta',
      [ComplexityLevel.VERY_HIGH]: 'Molto Alta',
    },
    scopeStoryTitle: '📖 Il Tuo Progetto in Parole',
    nextSteps: '📬 Prossimi Passi',
    nextStepsBody:
      'Il nostro team ti contatterà presto per discutere i dettagli del progetto e presentare una proposta completa.',
    ctaLabel: 'Visualizza il mio preventivo',
    footer: 'Budget Free Engine',
    footerAuto:
      'Questa email è stata generata automaticamente. Per domande, rispondi a questa email.',
    privacyNotice:
      'Hai ricevuto questa email perché hai compilato il modulo di preventivo.',
    rightsInfo:
      'Per esercitare i tuoi diritti (GDPR artt. 15-22): contatto via email.',
    unsubscribeLabel: 'Annulla iscrizione',
  },
}

function getStrings(locale: string): VisitorEmailStrings {
  const supported: SupportedLocale[] = ['pt_BR', 'en_US', 'es_ES', 'it_IT']
  const key = supported.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : 'pt_BR'
  return VISITOR_EMAIL_STRINGS[key]
}

interface VisitorEmailProps {
  lead: Lead
  estimation: EstimationResult
}

export function renderVisitorEmail({ lead, estimation }: VisitorEmailProps) {
  const s = getStrings(lead.locale)
  const firstName = lead.name.split(' ')[0]
  const greeting = s.greeting.replace('{name}', firstName)
  const complexityLabel =
    s.complexityLevels[estimation.complexity] ?? estimation.complexity

  // Mapa do locale do lead para atributo lang HTML
  const bcp47 =
    LOCALE_BCP47_MAP[lead.locale as Locale] ?? 'pt-BR'

  return (
    <Html lang={bcp47}>
      <Head />
      <Preview>
        {greeting} — {s.estimateTitle}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Cabeçalho */}
          <Section style={headerStyle}>
            <Heading style={h1Style}>🎉 Budget Free Engine</Heading>
            <Text style={subtitleStyle}>{s.intro}</Text>
          </Section>

          {/* Saudação */}
          <Section style={sectionStyle}>
            <Heading style={greetingStyle}>{greeting}</Heading>
            <Text style={introTextStyle}>{s.intro}</Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Estimativa */}
          <Section style={sectionStyle}>
            <Heading style={h2Style}>{s.estimateTitle}</Heading>

            <div style={estimateBoxStyle}>
              <Row style={{ marginBottom: '12px' }}>
                <Column style={{ width: '180px' }}>
                  <Text style={labelStyle}>{s.investment}</Text>
                </Column>
                <Column>
                  <Text style={estimateValueStyle}>
                    {formatCurrency(
                      estimation.priceMin,
                      estimation.currency as Currency,
                      estimation.locale as Locale
                    )}{' '}
                    –{' '}
                    {formatCurrency(
                      estimation.priceMax,
                      estimation.currency as Currency,
                      estimation.locale as Locale
                    )}
                  </Text>
                </Column>
              </Row>
              <Row style={{ marginBottom: '12px' }}>
                <Column style={{ width: '180px' }}>
                  <Text style={labelStyle}>{s.timeline}</Text>
                </Column>
                <Column>
                  <Text style={valueStyle}>
                    {estimation.daysMin} – {estimation.daysMax} {s.daysUnit}
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column style={{ width: '180px' }}>
                  <Text style={labelStyle}>{s.complexity}</Text>
                </Column>
                <Column>
                  <Text style={valueStyle}>{complexityLabel}</Text>
                </Column>
              </Row>
            </div>
          </Section>

          <Hr style={hrStyle} />

          {/* Scope Story — narrativa sem Q&A (GDPR minimization) */}
          <Section style={sectionStyle}>
            <Heading style={h2Style}>{s.scopeStoryTitle}</Heading>
            <Text style={narrativeStyle}>{estimation.scopeStory}</Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Próximos Passos */}
          <Section style={nextStepsStyle}>
            <Heading style={h2Style}>{s.nextSteps}</Heading>
            <Text style={nextStepsTextStyle}>{s.nextStepsBody}</Text>
          </Section>

          {/* CTA Button */}
          <Section style={{ ...sectionStyle, textAlign: 'center' as const }}>
            <Button
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://budgetfree.tech'}/${bcp47}/thank-you`}
              style={ctaButtonStyle}
            >
              {s.ctaLabel}
            </Button>
          </Section>

          {/* Rodapé */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>{s.footer}</Text>
            <Text style={footerAutoStyle}>{s.footerAuto}</Text>
            <Text style={privacyTextStyle}>{s.privacyNotice}</Text>
            <Text style={privacyTextStyle}>{s.rightsInfo}</Text>
            {lead.unsubscribe_token ? (
              <Text style={privacyTextStyle}>
                <a
                  href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://budgetfree.tech'}/${bcp47}/unsubscribe/${lead.unsubscribe_token}`}
                  style={{ color: '#93c5fd', textDecoration: 'underline' }}
                >
                  {s.unsubscribeLabel ?? 'Unsubscribe'}
                </a>
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Estilos inline para compatibilidade máxima de clientes de email
const bodyStyle = {
  backgroundColor: '#f3f4f6',
  fontFamily: 'Arial, sans-serif',
}
const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden' as const,
}
const headerStyle = {
  backgroundColor: '#2563eb',
  padding: '28px 32px',
  textAlign: 'center' as const,
}
const h1Style = {
  color: '#ffffff',
  fontSize: '26px',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}
const subtitleStyle = {
  color: '#bfdbfe',
  fontSize: '14px',
  margin: '0',
  textAlign: 'center' as const,
}
const sectionStyle = { padding: '20px 32px' }
const greetingStyle = {
  color: '#1e3a5f',
  fontSize: '22px',
  marginBottom: '8px',
}
const introTextStyle = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
}
const h2Style = {
  color: '#1e3a5f',
  fontSize: '18px',
  marginBottom: '12px',
}
const estimateBoxStyle = {
  backgroundColor: '#f0f9ff',
  padding: '16px',
  borderRadius: '6px',
  borderLeft: '4px solid #2563eb',
}
const labelStyle = { color: '#6b7280', fontSize: '14px', margin: '0' }
const valueStyle = { color: '#111827', fontSize: '14px', margin: '0' }
const estimateValueStyle = {
  color: '#16a34a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}
const narrativeStyle = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.7',
  backgroundColor: '#f9fafb',
  padding: '16px',
  borderRadius: '6px',
}
const nextStepsStyle = { padding: '20px 32px', backgroundColor: '#f0f9ff' }
const nextStepsTextStyle = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
}
const hrStyle = { borderColor: '#e5e7eb', margin: '0' }
const footerStyle = {
  backgroundColor: '#1e3a5f',
  padding: '16px 32px',
  textAlign: 'center' as const,
}
const footerTextStyle = {
  color: '#93c5fd',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
}
const footerAutoStyle = { color: '#6b7280', fontSize: '12px', margin: '0' }
const ctaButtonStyle = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '14px',
  display: 'inline-block',
}
const privacyTextStyle = {
  color: '#6b7280',
  fontSize: '11px',
  margin: '4px 0 0 0',
  lineHeight: '1.4',
}
