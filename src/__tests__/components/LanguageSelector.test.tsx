import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ---------------------------------------------------------------------------
// Mocks — must be declared before component import
// ---------------------------------------------------------------------------

const mockReplace = vi.fn()
const mockPathname = '/about'

vi.mock('next-intl', () => ({
  useLocale: () => 'pt-BR',
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      languageSelector: 'Select language',
    }
    return translations[key] ?? key
  },
}))

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
}))

vi.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['pt-BR', 'en-US', 'es-ES', 'it-IT'] as const,
    defaultLocale: 'pt-BR',
    localePrefix: 'always',
  },
}))

// Mock BottomSheet to render children directly when open
vi.mock('@/components/mobile/BottomSheet', () => ({
  BottomSheet: ({
    isOpen,
    children,
  }: {
    isOpen: boolean
    children: React.ReactNode
  }) => (isOpen ? <div data-testid="bottom-sheet">{children}</div> : null),
}))

// Force desktop mode (window.matchMedia returns false for mobile query)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

import { LanguageSelector } from '@/components/layout/LanguageSelector'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset cookie
    document.cookie = 'NEXT_LOCALE=; max-age=0'
  })

  it('renderiza trigger com label do locale atual (Portugues)', () => {
    render(<LanguageSelector />)
    const button = screen.getByTestId('language-selector-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('abre dropdown ao clicar no trigger', async () => {
    const user = userEvent.setup()
    render(<LanguageSelector />)
    const button = screen.getByTestId('language-selector-button')

    await user.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('language-selector-dropdown')).toBeInTheDocument()
  })

  it('mostra 4 opcoes com labels', async () => {
    const user = userEvent.setup()
    render(<LanguageSelector />)
    await user.click(screen.getByTestId('language-selector-button'))

    const dropdown = screen.getByTestId('language-selector-dropdown')
    const options = within(dropdown).getAllByRole('option')
    expect(options).toHaveLength(4)

    // Verifica labels
    expect(within(dropdown).getByText('Portugu\u00eas')).toBeInTheDocument()
    expect(within(dropdown).getByText('English')).toBeInTheDocument()
    expect(within(dropdown).getByText('Espa\u00f1ol')).toBeInTheDocument()
    expect(within(dropdown).getByText('Italiano')).toBeInTheDocument()
  })

  it('item do locale atual tem aria-selected=true', async () => {
    const user = userEvent.setup()
    render(<LanguageSelector />)
    await user.click(screen.getByTestId('language-selector-button'))

    const dropdown = screen.getByTestId('language-selector-dropdown')
    const options = within(dropdown).getAllByRole('option')

    // pt-BR e o locale atual (primeiro item)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
    expect(options[2]).toHaveAttribute('aria-selected', 'false')
    expect(options[3]).toHaveAttribute('aria-selected', 'false')
  })

  it('selecionar novo locale chama router.replace e seta cookie', async () => {
    const user = userEvent.setup()
    render(<LanguageSelector />)
    await user.click(screen.getByTestId('language-selector-button'))

    // Click on English option
    await user.click(screen.getByTestId('language-option-en-US'))

    expect(mockReplace).toHaveBeenCalledWith('/about', { locale: 'en-US' })
    expect(document.cookie).toContain('NEXT_LOCALE=en-US')
  })

  it('Escape fecha dropdown', async () => {
    const user = userEvent.setup()
    render(<LanguageSelector />)
    const button = screen.getByTestId('language-selector-button')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('click outside fecha dropdown', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <LanguageSelector />
      </div>,
    )
    const button = screen.getByTestId('language-selector-button')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByTestId('outside'))
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('ArrowDown/ArrowUp navega entre opcoes via keyboard no trigger', async () => {
    const user = userEvent.setup()
    render(<LanguageSelector />)
    const button = screen.getByTestId('language-selector-button')

    // Focus the button and open with ArrowDown
    button.focus()
    await user.keyboard('{ArrowDown}')

    // Dropdown should be open
    expect(button).toHaveAttribute('aria-expanded', 'true')

    const dropdown = screen.getByTestId('language-selector-dropdown')
    const options = within(dropdown).getAllByRole('option')

    // Current locale (pt-BR = index 0) should be focused initially
    expect(options[0]).toHaveAttribute('tabindex', '0')

    // ArrowDown moves to next option
    await user.keyboard('{ArrowDown}')
    expect(options[1]).toHaveAttribute('tabindex', '0')

    // ArrowUp moves back
    await user.keyboard('{ArrowUp}')
    expect(options[0]).toHaveAttribute('tabindex', '0')
  })
})
