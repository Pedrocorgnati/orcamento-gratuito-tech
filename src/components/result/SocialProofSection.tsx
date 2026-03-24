interface Testimonial {
  name: string
  role: string
  quote: string
}

// Depoimentos placeholder — substituir por dados reais em produção (FEAT-EE-008)
const STATIC_TESTIMONIALS: Testimonial[] = [
  {
    name:  'Carlos Mendes',
    role:  'CEO, StartupTech',
    quote: 'A estimativa foi muito precisa e me ajudou a planejar o orçamento com confiança.',
  },
  {
    name:  'Ana Rodrigues',
    role:  'Product Manager, FinBrasil',
    quote: 'Em menos de 5 minutos tive uma visão clara do investimento necessário para meu projeto.',
  },
  {
    name:  'Marco Silva',
    role:  'CTO, E-CommerceX',
    quote: 'O breakdown de complexidade foi essencial para alinhar expectativas com a equipe.',
  },
]

interface SocialProofSectionProps {
  completedCount: number
  /** URL locale (BCP-47), ex: 'pt-BR' */
  locale: string
}

const COUNTER_LABEL: Record<string, (count: string) => string> = {
  'pt-BR': (c) => `Mais de ${c} orçamentos gerados`,
  'en-US': (c) => `More than ${c} estimates generated`,
  'es-ES': (c) => `Más de ${c} presupuestos generados`,
  'it-IT': (c) => `Più di ${c} preventivi generati`,
}

const SECTION_ARIA_LABEL: Record<string, string> = {
  'pt-BR': 'Prova social',
  'en-US': 'Social proof',
  'es-ES': 'Prueba social',
  'it-IT': 'Prova sociale',
}

const TESTIMONIALS_TITLE: Record<string, string> = {
  'pt-BR': 'O que dizem nossos usuários',
  'en-US': 'What our users say',
  'es-ES': 'Lo que dicen nuestros usuarios',
  'it-IT': 'Cosa dicono i nostri utenti',
}

/**
 * Formata o contador para exibição:
 * - >= 100: arredonda para baixo até centena (ex: 1247 → 1200)
 * - < 100: exibe valor exato
 */
function formatCount(count: number, locale: string): string {
  const rounded = count >= 100 ? Math.floor(count / 100) * 100 : count
  // locale já está em formato BCP-47 (ex: 'pt-BR') — passado diretamente ao Intl
  return new Intl.NumberFormat(locale).format(rounded)
}

export function SocialProofSection({ completedCount, locale }: SocialProofSectionProps) {
  const counterFn         = COUNTER_LABEL[locale]      ?? COUNTER_LABEL['en-US']
  const testimonialsTitle = TESTIMONIALS_TITLE[locale]  ?? TESTIMONIALS_TITLE['en-US']
  const sectionAriaLabel  = SECTION_ARIA_LABEL[locale]  ?? SECTION_ARIA_LABEL['en-US']
  const formattedCount    = formatCount(completedCount, locale)

  return (
    <section
      className="mt-8 pt-6 border-t border-(--color-border)"
      aria-label={sectionAriaLabel}
    >
      {/* Contador de orçamentos — valor real do banco (FEAT-EE-008) */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {/* Avatares placeholder */}
        <div className="flex -space-x-2" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-(--color-background) flex items-center justify-center"
            >
              <span className="text-(--color-on-primary) text-xs font-semibold">{i}</span>
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold text-(--color-text-secondary)">
          {counterFn(formattedCount)}
        </p>
      </div>

      {/* Depoimentos placeholder */}
      <div>
        <h2 className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider text-center mb-4">
          {testimonialsTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATIC_TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="bg-(--color-surface) rounded-xl p-4 text-sm"
            >
              <p className="text-(--color-text-secondary) italic mb-3">&ldquo;{t.quote}&rdquo;</p>
              <footer className="text-xs text-(--color-text-secondary)">
                <cite className="not-italic font-semibold text-(--color-text-primary)">
                  {t.name}
                </cite>
                {' \u2014 '}
                {t.role}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
