import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { leadService } from '@/services/lead.service'

export const metadata: Metadata = {
  title: 'Detalhes do Lead — Admin | Budget Free Engine',
}

interface LeadDetailPageProps {
  params: Promise<{ locale: string; id: string }>
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function NarrativeField({ label, value }: { label: string; value: string | null }) {
  if (!value || value.trim().length === 0) return null
  return (
    <div data-testid={`lead-narrative-${label.toLowerCase().replace(/\s+/g, '-')}`} className="space-y-1">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">{label}</h4>
      <p className="whitespace-pre-wrap text-sm text-(--color-text-primary)">{value}</p>
    </div>
  )
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { locale, id } = await params
  const result = await leadService.findById(id)

  if (!result) notFound()

  const { lead, userNarrative } = result
  const hasNarrative = Boolean(
    userNarrative.vision ||
      userNarrative.mustHaves ||
      userNarrative.references ||
      userNarrative.openNotes
  )

  return (
    <div data-testid="page-admin-lead-detail" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/${locale}/admin/leads`}
            className="text-sm text-(--color-text-secondary) hover:text-(--color-text-primary)"
          >
            ← Voltar para leads
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-(--color-text-primary)">{lead.name}</h1>
          <p className="text-sm text-(--color-text-secondary)">
            {lead.email} · Criado em {formatDate(lead.created_at)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-(--color-surface) px-3 py-1 text-xs font-semibold uppercase">
            Score {lead.score}
          </span>
          <span className="text-xs text-(--color-text-secondary)">{lead.project_type}</span>
        </div>
      </div>

      <section
        data-testid="lead-detail-estimate"
        className="rounded-xl border border-(--color-border) bg-(--color-background) p-6"
      >
        <h2 className="mb-4 text-lg font-semibold text-(--color-text-primary)">Estimativa</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-(--color-text-secondary)">Faixa de preço</dt>
            <dd className="font-medium">
              {formatCurrency(lead.estimated_price_min)} – {formatCurrency(lead.estimated_price_max)}
            </dd>
          </div>
          <div>
            <dt className="text-(--color-text-secondary)">Prazo (dias)</dt>
            <dd className="font-medium">
              {lead.estimated_days_min} – {lead.estimated_days_max}
            </dd>
          </div>
          <div>
            <dt className="text-(--color-text-secondary)">Complexidade</dt>
            <dd className="font-medium">{lead.complexity}</dd>
          </div>
          <div>
            <dt className="text-(--color-text-secondary)">Telefone</dt>
            <dd className="font-medium">{lead.phone ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section
        data-testid="lead-detail-narrative"
        className="rounded-xl border border-(--color-border) bg-(--color-background) p-6"
      >
        <h2 className="mb-4 text-lg font-semibold text-(--color-text-primary)">
          Como o cliente descreveu
        </h2>
        {hasNarrative ? (
          <div className="space-y-4">
            <NarrativeField label="Em uma frase" value={userNarrative.vision} />
            <NarrativeField label="Funcionalidades obrigatórias" value={userNarrative.mustHaves} />
            <NarrativeField label="Referências" value={userNarrative.references} />
            <NarrativeField label="Notas adicionais" value={userNarrative.openNotes} />
          </div>
        ) : (
          <p className="text-sm text-(--color-text-secondary)">
            O cliente não preencheu o bloco narrativo (Q096–Q099).
          </p>
        )}
      </section>

      {lead.scope_story && (
        <section
          data-testid="lead-detail-scope-story"
          className="rounded-xl border border-(--color-border) bg-(--color-background) p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-(--color-text-primary)">
            Resumo do escopo enviado por email
          </h2>
          <p className="whitespace-pre-wrap text-sm text-(--color-text-primary)">
            {lead.scope_story}
          </p>
        </section>
      )}
    </div>
  )
}
