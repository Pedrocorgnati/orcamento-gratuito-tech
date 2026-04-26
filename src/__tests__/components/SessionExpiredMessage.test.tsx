import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const pushMock = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      title: 'Sua sessão expirou',
      description:
        'Por inatividade prolongada (mais de 7 dias), seu progresso não pode mais ser retomado.',
      cta: 'Começar novo orçamento',
    }
    return map[key] ?? key
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

import { SessionExpiredMessage } from '@/components/flow/SessionExpiredMessage'

describe('SessionExpiredMessage (CL-052)', () => {
  it('renderiza titulo, descricao e CTA acessivel', () => {
    render(<SessionExpiredMessage locale="pt-BR" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/expirou/i)
    expect(
      screen.getByRole('button', { name: /novo orçamento/i })
    ).toBeInTheDocument()
  })

  it('CTA redireciona para /[locale]/flow', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<SessionExpiredMessage locale="en-US" />)
    await user.click(screen.getByTestId('session-expired-cta'))
    expect(pushMock).toHaveBeenCalledWith('/en-US/flow')
  })
})
