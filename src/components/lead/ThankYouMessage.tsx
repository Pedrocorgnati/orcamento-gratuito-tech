import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ThankYouMessageProps {
  name: string | null
  locale: string
  homeHref: string
}

const MESSAGES: Record<string, {
  title: (name: string | null) => string
  subtitle: string
  nextSteps: string[]
  nextStepsAriaLabel: string
  shareTitle: string
  shareLabel: string
  homeLabel: string
}> = {
  'pt-BR': {
    title: (name) => name ? `Obrigado, ${name}!` : 'Obrigado!',
    subtitle: 'Sua análise está sendo preparada.',
    nextSteps: [
      'Em breve você receberá um email com sua estimativa detalhada.',
      'Nosso time analisará seu projeto e entrará em contato.',
      'Enquanto isso, sinta-se à vontade para voltar ao início e explorar mais.',
    ],
    nextStepsAriaLabel: 'Próximos passos',
    shareTitle: 'Compartilhe com sua equipe',
    shareLabel: 'Compartilhar (em breve)',
    homeLabel: 'Voltar ao início',
  },
  'en-US': {
    title: (name) => name ? `Thank you, ${name}!` : 'Thank you!',
    subtitle: 'Your analysis is being prepared.',
    nextSteps: [
      'You will soon receive an email with your detailed estimate.',
      'Our team will review your project and get in touch.',
      'In the meantime, feel free to go back home and explore more.',
    ],
    nextStepsAriaLabel: 'Next steps',
    shareTitle: 'Share with your team',
    shareLabel: 'Share (coming soon)',
    homeLabel: 'Back to home',
  },
  'es-ES': {
    title: (name) => name ? `¡Gracias, ${name}!` : '¡Gracias!',
    subtitle: 'Tu análisis está siendo preparado.',
    nextSteps: [
      'Pronto recibirás un correo con tu estimación detallada.',
      'Nuestro equipo analizará tu proyecto y se pondrá en contacto.',
      'Mientras tanto, siéntete libre de volver al inicio.',
    ],
    nextStepsAriaLabel: 'Próximos pasos',
    shareTitle: 'Comparte con tu equipo',
    shareLabel: 'Compartir (próximamente)',
    homeLabel: 'Volver al inicio',
  },
  'it-IT': {
    title: (name) => name ? `Grazie, ${name}!` : 'Grazie!',
    subtitle: 'La tua analisi è in fase di preparazione.',
    nextSteps: [
      'A breve riceverai una email con la tua stima dettagliata.',
      'Il nostro team analizzerà il tuo progetto e ti contatterà.',
      'Nel frattempo, torna alla home per esplorare di più.',
    ],
    nextStepsAriaLabel: 'Prossimi passi',
    shareTitle: 'Condividi con il tuo team',
    shareLabel: 'Condividi (prossimamente)',
    homeLabel: 'Torna alla home',
  },
}

function CheckCircleIcon() {
  return (
    <svg
      className="w-16 h-16 text-(--color-success) mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

export function ThankYouMessage({ name, locale, homeHref }: ThankYouMessageProps) {
  const content = MESSAGES[locale] ?? MESSAGES['en-US']!

  return (
    <Card data-testid="thank-you-card" className="p-8 text-center shadow-(--shadow-lg) rounded-2xl bg-(--color-background)">
      {/* Ícone de sucesso — decorativo */}
      <CheckCircleIcon />

      {/* Título personalizado */}
      <h1 data-testid="thank-you-title" className="text-2xl md:text-3xl font-bold text-(--color-text-primary) mb-2">
        {content.title(name)}
      </h1>

      {/* Subtítulo */}
      <p data-testid="thank-you-subtitle" className="text-lg text-(--color-text-secondary) mb-6">
        {content.subtitle}
      </p>

      {/* Próximos passos */}
      <ul data-testid="thank-you-next-steps" className="text-left space-y-3 mb-8" aria-label={content.nextStepsAriaLabel}>
        {content.nextSteps.map((step, i) => (
          <li key={i} data-testid={`thank-you-next-step-${i + 1}`} className="flex items-start gap-3 text-sm text-(--color-text-secondary)">
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full bg-(--color-accent) text-(--color-on-accent) flex items-center justify-center text-xs font-bold mt-0.5"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ul>

      {/* Botões */}
      <div data-testid="thank-you-actions" className="space-y-3">
        {/* ShareButtons — placeholder V1, disabled */}
        <div>
          <p className="text-sm text-(--color-text-secondary) mb-2">{content.shareTitle}</p>
          <Button
            disabled
            data-testid="thank-you-share-button"
            className="w-full opacity-50 cursor-not-allowed"
            aria-label={content.shareLabel}
            title="Disponível em breve"
          >
            {content.shareLabel}
          </Button>
        </div>

        {/* Link para home */}
        <a
          href={homeHref}
          data-testid="thank-you-home-link"
          className="block w-full text-center py-2 px-4 text-(--color-text-secondary) hover:text-(--color-text-primary) text-sm font-medium transition-colors"
        >
          {content.homeLabel}
        </a>
      </div>
    </Card>
  )
}
