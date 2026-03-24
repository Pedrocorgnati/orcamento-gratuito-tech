'use client'

export default function FlowError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center bg-white dark:bg-gray-950">
      <div className="text-4xl" aria-hidden="true">⚠️</div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
        Algo deu errado
      </h1>
      <p className="text-base text-gray-500 dark:text-gray-400 max-w-sm">
        Ocorreu um erro ao iniciar o orçamento. Tente novamente.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
