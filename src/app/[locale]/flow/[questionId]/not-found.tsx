import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/lib/constants'

export default function QuestionNotFound() {
  return (
    <div data-testid="page-flow-question-not-found" className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center bg-white dark:bg-gray-950">
      <div className="text-4xl" aria-hidden="true">🔍</div>
      <h1 data-testid="flow-question-not-found-title" className="text-xl font-semibold text-gray-900 dark:text-white">
        Pergunta não encontrada
      </h1>
      <p data-testid="flow-question-not-found-message" className="text-base text-gray-500 dark:text-gray-400 max-w-sm">
        O orçamento pode ter expirado ou o link está incorreto.
      </p>
      <Link
        href={ROUTES.flow}
        data-testid="flow-question-not-found-restart-link"
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
      >
        Iniciar novo orçamento
      </Link>
    </div>
  )
}
