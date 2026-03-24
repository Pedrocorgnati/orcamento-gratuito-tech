import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InlineEmailCapture } from '../InlineEmailCapture'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  promise: jest.fn(),
}

jest.mock('@/providers/ToastProvider', () => ({
  toast: mockToast,
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  sessionId: 'session-123',
  locale: 'pt-BR',
  onComplete: jest.fn(),
}

function renderComponent(overrides?: Partial<typeof defaultProps>) {
  return render(<InlineEmailCapture {...defaultProps} {...overrides} />)
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('InlineEmailCapture', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
  })

  it('renderiza com strings pt-BR', () => {
    renderComponent()

    expect(screen.getByText('Quer receber o resultado por e-mail?')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pular esta etapa' })).toBeInTheDocument()
  })

  it('renderiza com strings en-US', () => {
    renderComponent({ locale: 'en-US' })

    expect(screen.getByText('Want to receive the result by email?')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip this step' })).toBeInTheDocument()
  })

  it('click em skip chama onComplete(undefined)', async () => {
    const user = userEvent.setup()
    const onComplete = jest.fn()
    renderComponent({ onComplete })

    await user.click(screen.getByRole('button', { name: 'Pular esta etapa' }))

    expect(onComplete).toHaveBeenCalledWith(undefined)
  })

  it('submit com email valido faz fetch PATCH e chama onComplete com email', async () => {
    const user = userEvent.setup()
    const onComplete = jest.fn()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'session-123', intermediate_email: 'test@example.com' }),
    })

    renderComponent({ onComplete })

    await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/sessions/session-123/email',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      )
    })

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('erro de API chama toast.error e onComplete(undefined)', async () => {
    const user = userEvent.setup()
    const onComplete = jest.fn()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { code: 'INTERNAL_ERROR', message: 'Erro' } }),
    })

    renderComponent({ onComplete })

    await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalledWith(undefined)
    })
  })
})
