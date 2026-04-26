import 'server-only'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Preview,
  Button,
} from '@react-email/components'
import { Locale, LOCALE_BCP47_MAP } from '@/lib/enums'

// Locales suportados (Locale enum usa underscore: pt_BR)
type SupportedLocale = 'pt_BR' | 'en_US' | 'es_ES' | 'it_IT'

interface ResumeEmailStrings {
  subject: string
  preview: string
  greeting: string
  body: string
  progressLabel: string
  ctaLabel: string
  expiryNotice: string
  footer: string
  privacyNotice: string
  rightsInfo: string
  unsubscribeLabel: string
  unsubscribeAction?: string
}

// CL-110 / CL-111 / CL-141 — Email automatico de retomada apos 24h de abandono.
// Mantem o padrao de visitorEmail/ownerEmail: strings embutidas por locale,
// sem dependencia de next-intl no servidor de email (react-email nao roda dentro
// do request lifecycle do next-intl).
const RESUME_EMAIL_STRINGS: Record<SupportedLocale, ResumeEmailStrings> = {
  pt_BR: {
    subject: 'Seu orcamento em progresso — volte e finalize',
    preview: 'Retome de onde parou e receba sua estimativa em minutos.',
    greeting: 'Olá!',
    body:
      'Voce comecou a calcular um orcamento no Budget Free Engine e parou no meio do caminho. Suas respostas estao salvas e voce pode retomar exatamente de onde parou.',
    progressLabel: 'Seu progresso:',
    ctaLabel: 'Retomar meu orcamento',
    expiryNotice:
      'Suas respostas ficam disponiveis por tempo limitado. Retome agora para nao perder o progresso.',
    footer: 'Budget Free Engine',
    privacyNotice:
      'Voce recebeu este email porque iniciou uma estimativa e informou seu endereco durante o fluxo (interesse legitimo — LGPD/GDPR).',
    rightsInfo:
      'Para exercer seus direitos ou deixar de receber estes lembretes, responda este email.',
    unsubscribeLabel: 'Politica de Privacidade',
    unsubscribeAction: 'Cancelar lembretes',
  },
  en_US: {
    subject: 'Your estimate is in progress — come back and finish',
    preview: 'Pick up where you left off and get your estimate in minutes.',
    greeting: 'Hi there!',
    body:
      'You started calculating an estimate with Budget Free Engine and paused halfway. Your answers are saved and you can pick up right where you left off.',
    progressLabel: 'Your progress:',
    ctaLabel: 'Resume my estimate',
    expiryNotice:
      'Your answers are kept for a limited time. Come back now to avoid losing your progress.',
    footer: 'Budget Free Engine',
    privacyNotice:
      'You received this email because you started an estimate and shared your address during the flow (legitimate interest — GDPR/LGPD).',
    rightsInfo:
      'To exercise your rights or stop receiving these reminders, reply to this email.',
    unsubscribeLabel: 'Privacy Policy',
    unsubscribeAction: 'Stop reminders',
  },
  es_ES: {
    subject: 'Tu presupuesto en progreso — vuelve y finaliza',
    preview: 'Retoma donde lo dejaste y recibe tu presupuesto en minutos.',
    greeting: '¡Hola!',
    body:
      'Empezaste a calcular un presupuesto en Budget Free Engine y lo dejaste a la mitad. Tus respuestas estan guardadas y puedes continuar justo donde las dejaste.',
    progressLabel: 'Tu progreso:',
    ctaLabel: 'Reanudar mi presupuesto',
    expiryNotice:
      'Tus respuestas se conservan por tiempo limitado. Vuelve ahora para no perder tu progreso.',
    footer: 'Budget Free Engine',
    privacyNotice:
      'Recibiste este correo porque iniciaste una estimacion y compartiste tu direccion durante el flujo (interes legitimo — GDPR/LGPD).',
    rightsInfo:
      'Para ejercer tus derechos o dejar de recibir estos recordatorios, responde a este email.',
    unsubscribeLabel: 'Politica de Privacidad',
    unsubscribeAction: 'Dejar de recibir',
  },
  it_IT: {
    subject: 'Il tuo preventivo in corso — torna e completa',
    preview: 'Riprendi da dove hai lasciato e ricevi il tuo preventivo in pochi minuti.',
    greeting: 'Ciao!',
    body:
      'Hai iniziato a calcolare un preventivo con Budget Free Engine e ti sei fermato a meta strada. Le tue risposte sono salvate e puoi riprendere esattamente da dove avevi lasciato.',
    progressLabel: 'Il tuo avanzamento:',
    ctaLabel: 'Riprendi il mio preventivo',
    expiryNotice:
      'Le tue risposte vengono conservate per un tempo limitato. Torna adesso per non perdere i progressi.',
    footer: 'Budget Free Engine',
    privacyNotice:
      'Hai ricevuto questa email perche hai iniziato un preventivo e condiviso il tuo indirizzo durante il flusso (interesse legittimo — GDPR/LGPD).',
    rightsInfo:
      'Per esercitare i tuoi diritti o non ricevere piu questi promemoria, rispondi a questa email.',
    unsubscribeLabel: 'Informativa Privacy',
    unsubscribeAction: 'Annulla promemoria',
  },
}

const SUPPORTED_LOCALES: SupportedLocale[] = [
  'pt_BR',
  'en_US',
  'es_ES',
  'it_IT',
]

// Normaliza locale de sessao (aceita "pt-BR" ou "pt_BR") para o formato do map.
function normalizeLocale(input: string | null | undefined): SupportedLocale {
  if (!input) return 'pt_BR'
  const underscored = input.replace('-', '_')
  return SUPPORTED_LOCALES.includes(underscored as SupportedLocale)
    ? (underscored as SupportedLocale)
    : 'pt_BR'
}

export function getResumeEmailSubject(locale: string | null | undefined): string {
  const key = normalizeLocale(locale)
  return RESUME_EMAIL_STRINGS[key].subject
}

export function getResumeEmailStrings(locale: string | null | undefined) {
  const key = normalizeLocale(locale)
  return RESUME_EMAIL_STRINGS[key]
}

export interface ResumeEmailProps {
  sessionId: string
  locale: string
  baseUrl: string
  progress?: number
  // CL-232: optional unsubscribe token. Defaults to sessionId (cron unsubscribe).
  unsubscribeToken?: string
}

export function renderResumeEmail({
  sessionId,
  locale,
  baseUrl,
  progress,
  unsubscribeToken,
}: ResumeEmailProps) {
  const s = getResumeEmailStrings(locale)
  const key = normalizeLocale(locale)
  const bcp47 = LOCALE_BCP47_MAP[key as Locale] ?? 'pt-BR'
  const resumeUrl = `${baseUrl}/${bcp47}/resume/${sessionId}`
  const privacyUrl = `${baseUrl}/${bcp47}/privacy`
  const unsubscribeUrl = `${baseUrl}/${bcp47}/unsubscribe/${unsubscribeToken ?? sessionId}`
  const showProgress =
    typeof progress === 'number' && progress > 0 && progress < 100

  return (
    <Html lang={bcp47}>
      <Head />
      <Preview>{s.preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Heading style={h1Style}>Budget Free Engine</Heading>
          </Section>

          <Section style={sectionStyle}>
            <Heading style={greetingStyle}>{s.greeting}</Heading>
            <Text style={introTextStyle}>{s.body}</Text>

            {showProgress ? (
              <Text style={progressStyle}>
                {s.progressLabel} <strong>{Math.round(progress!)}%</strong>
              </Text>
            ) : null}
          </Section>

          <Section style={{ ...sectionStyle, textAlign: 'center' as const }}>
            <Button href={resumeUrl} style={ctaButtonStyle}>
              {s.ctaLabel}
            </Button>
          </Section>

          <Section style={sectionStyle}>
            <Text style={noticeStyle}>{s.expiryNotice}</Text>
          </Section>

          <Hr style={hrStyle} />

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>{s.footer}</Text>
            <Text style={privacyTextStyle}>{s.privacyNotice}</Text>
            <Text style={privacyTextStyle}>{s.rightsInfo}</Text>
            <Text style={privacyTextStyle}>
              <a href={privacyUrl} style={linkStyle}>
                {s.unsubscribeLabel}
              </a>
              {' · '}
              <a href={unsubscribeUrl} style={linkStyle}>
                {s.unsubscribeAction ?? 'Unsubscribe'}
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Versao text/plain para clientes de email sem HTML (acessibilidade + deliverability)
export function renderResumeEmailText({
  sessionId,
  locale,
  baseUrl,
  progress,
  unsubscribeToken,
}: ResumeEmailProps): string {
  const s = getResumeEmailStrings(locale)
  const key = normalizeLocale(locale)
  const bcp47 = LOCALE_BCP47_MAP[key as Locale] ?? 'pt-BR'
  const resumeUrl = `${baseUrl}/${bcp47}/resume/${sessionId}`
  const privacyUrl = `${baseUrl}/${bcp47}/privacy`
  const unsubscribeUrl = `${baseUrl}/${bcp47}/unsubscribe/${unsubscribeToken ?? sessionId}`
  const showProgress =
    typeof progress === 'number' && progress > 0 && progress < 100

  return [
    s.greeting,
    '',
    s.body,
    showProgress ? `${s.progressLabel} ${Math.round(progress!)}%` : null,
    '',
    `${s.ctaLabel}: ${resumeUrl}`,
    '',
    s.expiryNotice,
    '',
    '—',
    s.footer,
    s.privacyNotice,
    s.rightsInfo,
    `${s.unsubscribeLabel}: ${privacyUrl}`,
    `${s.unsubscribeAction ?? 'Unsubscribe'}: ${unsubscribeUrl}`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

// Estilos inline (compatibilidade maxima com clientes de email)
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
  fontSize: '24px',
  margin: '0',
  textAlign: 'center' as const,
}
const sectionStyle = { padding: '20px 32px' }
const greetingStyle = {
  color: '#1e3a5f',
  fontSize: '20px',
  marginBottom: '8px',
}
const introTextStyle = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
}
const progressStyle = {
  color: '#2563eb',
  fontSize: '14px',
  marginTop: '12px',
}
const noticeStyle = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.6',
  backgroundColor: '#f9fafb',
  padding: '12px 16px',
  borderRadius: '6px',
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
  margin: '0 0 6px 0',
}
const privacyTextStyle = {
  color: '#cbd5e1',
  fontSize: '11px',
  margin: '4px 0 0 0',
  lineHeight: '1.4',
}
const linkStyle = {
  color: '#93c5fd',
  textDecoration: 'underline',
}
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
