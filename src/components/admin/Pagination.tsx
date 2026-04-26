'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface PaginationProps {
  total: number
  page: number
  pageSize: number
}

export function Pagination({ total, page, pageSize }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(total / pageSize)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  if (total === 0) return null

  return (
    <div data-testid="admin-leads-pagination" className="flex items-center justify-between px-4 py-3 border-t border-(--color-border) bg-(--color-background) rounded-b-lg">
      <p data-testid="admin-leads-pagination-summary" className="text-sm text-(--color-text-secondary)">
        {from}–{to} de {total} resultados
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="admin-leads-pagination-prev-button"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm border border-(--color-border) rounded-md text-(--color-text-secondary) hover:bg-(--color-surface) disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          ← Anterior
        </button>
        <span data-testid="admin-leads-pagination-current" className="text-sm text-(--color-text-primary)" aria-current="page">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          data-testid="admin-leads-pagination-next-button"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm border border-(--color-border) rounded-md text-(--color-text-secondary) hover:bg-(--color-surface) disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Próxima página"
        >
          Próxima →
        </button>
      </div>
    </div>
  )
}
