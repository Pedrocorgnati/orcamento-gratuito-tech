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
  Link,
  Preview,
  Button,
} from '@react-email/components'
import type { EstimationResult } from '@/lib/types'
import type { Lead } from '@prisma/client'
import { formatCurrency } from '@/lib/utils/format'
import { Locale, Currency, ComplexityLevel, LeadScore } from '@/lib/enums'

interface OwnerEmailProps {
  lead: Lead
  estimation: EstimationResult
}

// Configuração de badge por score A/B/C
const SCORE_CONFIG: Record<
  LeadScore,
  { label: string; bg: string; color: string; description: string }
> = {
  [LeadScore.A]: {
    label: 'Score A — Lead Qualificado',
    bg: '#16a34a',
    color: '#ffffff',
    description:
      'Alta probabilidade de conversão. Budget e timeline alinhados.',
  },
  [LeadScore.B]: {
    label: 'Score B — Lead Potencial',
    bg: '#d97706',
    color: '#ffffff',
    description:
      'Potencial de conversão com negociação. Verificar budget ou timeline.',
  },
  [LeadScore.C]: {
    label: 'Score C — Baixa Prioridade',
    bg: '#dc2626',
    color: '#ffffff',
    description: 'Budget ou timeline significativamente abaixo do estimado.',
  },
}

const COMPLEXITY_LABELS: Record<ComplexityLevel, string> = {
  [ComplexityLevel.LOW]: 'Baixa',
  [ComplexityLevel.MEDIUM]: 'Média',
  [ComplexityLevel.HIGH]: 'Alta',
  [ComplexityLevel.VERY_HIGH]: 'Muito Alta',
}

export function renderOwnerEmail({ lead, estimation }: OwnerEmailProps) {
  const scoreKey = (lead.score as LeadScore) ?? LeadScore.C
  const scoreConfig = SCORE_CONFIG[scoreKey] ?? SCORE_CONFIG[LeadScore.C]
  const complexityLabel =
    COMPLEXITY_LABELS[estimation.complexity] ?? estimation.complexity

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        {`🎯 Novo Lead: ${lead.name} — Score ${lead.score_total} (${lead.score})`}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Cabeçalho */}
          <Section style={headerStyle}>
            <Heading style={h1Style}>🎯 Novo Lead Capturado</Heading>
            <Text style={subtitleStyle}>
              Budget Free Engine — Notificação Automática
            </Text>
          </Section>

          {/* Badge de Score */}
          <Section style={sectionStyle}>
            <div
              style={{
                ...badgeStyle,
                backgroundColor: scoreConfig.bg,
                color: scoreConfig.color,
              }}
            >
              {scoreConfig.label} — {lead.score_total}/100
            </div>
            <Text style={descriptionStyle}>{scoreConfig.description}</Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Dados do Lead */}
          <Section style={sectionStyle}>
            <Heading style={h2Style}>👤 Dados do Lead</Heading>
            <Row>
              <Column>
                <Text style={labelStyle}>Nome:</Text>
              </Column>
              <Column>
                <Text style={valueStyle}>{lead.name}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={labelStyle}>Email:</Text>
              </Column>
              <Column>
                <Link href={`mailto:${lead.email}`} style={linkStyle}>
                  {lead.email}
                </Link>
              </Column>
            </Row>
            {lead.phone && (
              <Row>
                <Column>
                  <Text style={labelStyle}>Telefone:</Text>
                </Column>
                <Column>
                  <Text style={valueStyle}>{lead.phone}</Text>
                </Column>
              </Row>
            )}
            {lead.company && (
              <Row>
                <Column>
                  <Text style={labelStyle}>Empresa:</Text>
                </Column>
                <Column>
                  <Text style={valueStyle}>{lead.company}</Text>
                </Column>
              </Row>
            )}
            <Row>
              <Column>
                <Text style={labelStyle}>Locale:</Text>
              </Column>
              <Column>
                <Text style={valueStyle}>{lead.locale}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hrStyle} />

          {/* Estimativa */}
          <Section style={sectionStyle}>
            <Heading style={h2Style}>💰 Estimativa do Projeto</Heading>
            <Row>
              <Column>
                <Text style={labelStyle}>Investimento:</Text>
              </Column>
              <Column>
                <Text
                  style={{ ...valueStyle, fontWeight: 'bold', color: '#16a34a' }}
                >
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
            <Row>
              <Column>
                <Text style={labelStyle}>Prazo:</Text>
              </Column>
              <Column>
                <Text style={valueStyle}>
                  {estimation.daysMin} – {estimation.daysMax} dias úteis
                </Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={labelStyle}>Complexidade:</Text>
              </Column>
              <Column>
                <Text style={valueStyle}>{complexityLabel}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hrStyle} />

          {/* Scope Story */}
          <Section style={sectionStyle}>
            <Heading style={h2Style}>📖 Scope Story</Heading>
            <Text style={narrativeStyle}>{estimation.scopeStory}</Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Features */}
          {estimation.features.length > 0 && (
            <Section style={sectionStyle}>
              <Heading style={h2Style}>⚙️ Funcionalidades Identificadas</Heading>
              {estimation.features.map((feature, i) => (
                <Text key={i} style={featureItemStyle}>
                  • {feature}
                </Text>
              ))}
            </Section>
          )}

          {/* Alerta de Suspeita (INT-103) */}
          {lead.is_suspicious && (
            <>
              <Hr style={hrStyle} />
              <Section style={{ ...sectionStyle, backgroundColor: '#fef3c7' }}>
                <Heading style={{ ...h2Style, color: '#92400e' }}>
                  ⚠️ Atenção: Respostas Suspeitas Detectadas
                </Heading>
                <Text style={{ color: '#92400e', fontSize: '14px' }}>
                  Padrão detectado: <strong>{lead.suspicious_pattern}</strong>
                </Text>
                <Text style={{ color: '#78350f', fontSize: '13px', marginTop: '4px' }}>
                  Recomendamos verificar a autenticidade das informações antes de entrar em
                  contato. O lead foi salvo normalmente e o score pode estar subestimado.
                </Text>
              </Section>
            </>
          )}

          <Hr style={hrStyle} />

          {/* CTA Button */}
          <Section style={{ ...sectionStyle, textAlign: 'center' as const }}>
            <Button
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://budgetfree.tech'}/admin/leads`}
              style={ctaButtonStyle}
            >
              Ver lead no painel
            </Button>
          </Section>

          <Hr style={hrStyle} />

          {/* Rodapé */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Budget Free Engine · {new Date().toLocaleDateString('pt-BR')}
            </Text>
            <Text style={footerTextStyle}>
              Este email foi gerado automaticamente. Não responda a este
              endereço.
            </Text>
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
const headerStyle = { backgroundColor: '#1e3a5f', padding: '24px 32px' }
const h1Style = {
  color: '#ffffff',
  fontSize: '24px',
  margin: '0 0 4px 0',
}
const subtitleStyle = { color: '#93c5fd', fontSize: '14px', margin: '0' }
const sectionStyle = { padding: '20px 32px' }
const badgeStyle = {
  display: 'inline-block',
  padding: '8px 16px',
  borderRadius: '4px',
  fontWeight: 'bold',
  fontSize: '16px',
}
const descriptionStyle = {
  color: '#6b7280',
  fontSize: '14px',
  marginTop: '8px',
}
const h2Style = {
  color: '#1e3a5f',
  fontSize: '18px',
  marginBottom: '12px',
}
const labelStyle = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '4px 0',
  width: '140px',
}
const valueStyle = { color: '#111827', fontSize: '14px', margin: '4px 0' }
const linkStyle = { color: '#2563eb', textDecoration: 'none' }
const narrativeStyle = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  backgroundColor: '#f9fafb',
  padding: '12px',
  borderRadius: '4px',
}
const featureItemStyle = { color: '#374151', fontSize: '13px', margin: '2px 0' }
const hrStyle = { borderColor: '#e5e7eb', margin: '0' }
const footerStyle = { backgroundColor: '#f9fafb', padding: '16px 32px' }
const ctaButtonStyle = {
  backgroundColor: '#1e3a5f',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '14px',
  display: 'inline-block',
}
const footerTextStyle = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '2px 0',
}
