'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ProjectType } from '@/lib/enums'
import { ScoreBadge } from './ScoreBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { LeadSummary } from '@/services/lead.service'

const PROJECT_TYPE_LABELS: Record<string, string> = {
  [ProjectType.WEBSITE]: 'Website',
  [ProjectType.ECOMMERCE]: 'E-commerce',
  [ProjectType.WEB_APP]: 'Sistema Web',
  [ProjectType.MOBILE_APP]: 'App Mobile',
  [ProjectType.AUTOMATION_AI]: 'Automação/IA',
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
  }).format(new Date(date))
}

const columnHelper = createColumnHelper<LeadSummary>()

interface LeadsTableProps {
  data: LeadSummary[]
  isLoading?: boolean
  error?: string | null
}

export function LeadsTable({ data, error = null }: LeadsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ])

  const columns = [
    columnHelper.accessor('name', {
      header: 'Nome',
      cell: (info) => (
        <span className="font-medium text-(--color-text-primary) truncate max-w-[140px] block">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => (
        <span className="text-(--color-text-secondary) truncate max-w-[180px] block">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('score', {
      header: 'Score',
      cell: (info) => <ScoreBadge score={info.getValue()} />,
    }),
    columnHelper.accessor('project_type', {
      header: 'Tipo de Projeto',
      cell: (info) => (
        <span className="text-(--color-text-primary)">
          {PROJECT_TYPE_LABELS[info.getValue()] ?? info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'budget_range',
      header: 'Estimativa',
      cell: ({ row }) => {
        const min = row.original.estimated_price_min
        const max = row.original.estimated_price_max
        return (
          <span className="text-sm text-(--color-text-primary) whitespace-nowrap">
            {formatCurrency(min)} – {formatCurrency(max)}
          </span>
        )
      },
    }),
    columnHelper.accessor('created_at', {
      header: 'Data',
      cell: (info) => (
        <span className="text-sm text-(--color-text-secondary) hidden md:table-cell">
          {formatDate(info.getValue())}
        </span>
      ),
    }),
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  })

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center">
        <p className="text-sm font-medium text-red-600">Erro ao carregar leads</p>
        <p className="mt-1 text-xs text-red-500">{error}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-(--color-border) bg-(--color-background)">
        <EmptyState
          message="Nenhum lead encontrado"
          description="Ainda não há orçamentos gerados ou os filtros não retornaram resultados."
        />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-background) shadow-(--shadow-sm)">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-(--color-border) bg-(--color-surface)">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-(--color-text-secondary) cursor-pointer select-none hover:bg-(--color-muted)"
                    onClick={header.column.getToggleSortingHandler()}
                    aria-sort={
                      header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : header.column.getIsSorted() === 'desc'
                          ? 'descending'
                          : 'none'
                    }
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && (
                        <span aria-hidden="true"> ↑</span>
                      )}
                      {header.column.getIsSorted() === 'desc' && (
                        <span aria-hidden="true"> ↓</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-(--color-surface) transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
