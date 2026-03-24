/**
 * Testes de Acessibilidade — Componentes do Lead Capture (module-12)
 * Rastreabilidade: INT-090, INT-091, SEC-010, FEAT-LN-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ConsentCheckbox } from '@/components/lead/ConsentCheckbox'
import { HoneypotField } from '@/components/lead/HoneypotField'
import { ThankYouMessage } from '@/components/lead/ThankYouMessage'

expect.extend(toHaveNoViolations)

// Mock register para react-hook-form
const mockRegister = vi.fn().mockReturnValue({
  name: 'test',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
})

// ─────────────────────────────────────────────────────────────────────────────
// ConsentCheckbox — Acessibilidade
// ─────────────────────────────────────────────────────────────────────────────

describe('ConsentCheckbox — Acessibilidade', () => {
  it('não deve ter violações axe-core (pt-BR)', async () => {
    const { container } = render(
      <ConsentCheckbox
        register={mockRegister}
        errors={{}}
        locale="pt-BR"
        privacyPolicyHref="/pt-BR/privacy"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('checkbox principal tem aria-required="true"', () => {
    const { getByRole } = render(
      <ConsentCheckbox
        register={mockRegister}
        errors={{}}
        locale="pt-BR"
        privacyPolicyHref="/pt-BR/privacy"
      />
    )
    const checkboxes = document.querySelectorAll('input[type="checkbox"]')
    expect(checkboxes[0]!.getAttribute('aria-required')).toBe('true')
  })

  it('checkbox marketing tem aria-required="false"', () => {
    const { container } = render(
      <ConsentCheckbox
        register={mockRegister}
        errors={{}}
        locale="pt-BR"
        privacyPolicyHref="/pt-BR/privacy"
      />
    )
    const marketingCheckbox = container.querySelector('#marketing_consent')
    expect(marketingCheckbox!.getAttribute('aria-required')).toBe('false')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// HoneypotField — Acessibilidade
// ─────────────────────────────────────────────────────────────────────────────

describe('HoneypotField — Acessibilidade', () => {
  it('container tem aria-hidden="true"', () => {
    const { container } = render(<HoneypotField register={mockRegister} />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.getAttribute('aria-hidden')).toBe('true')
  })

  it('input tem tabIndex={-1} (não focável via Tab)', () => {
    const { container } = render(<HoneypotField register={mockRegister} />)
    const input = container.querySelector('input')
    expect(input!.tabIndex).toBe(-1)
  })

  it('não usa display:none (bots detectam)', () => {
    const { container } = render(<HoneypotField register={mockRegister} />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.display).not.toBe('none')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ThankYouMessage — Acessibilidade
// ─────────────────────────────────────────────────────────────────────────────

describe('ThankYouMessage — Acessibilidade', () => {
  it('não deve ter violações axe-core', async () => {
    const { container } = render(
      <ThankYouMessage name="Carlos" locale="pt-BR" homeHref="/pt-BR" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('ícone tem aria-hidden="true"', () => {
    const { container } = render(
      <ThankYouMessage name="Carlos" locale="pt-BR" homeHref="/pt-BR" />
    )
    const svg = container.querySelector('svg')
    expect(svg!.getAttribute('aria-hidden')).toBe('true')
  })

  it('h1 renderiza com nome personalizado', () => {
    const { getByRole } = render(
      <ThankYouMessage name="Carlos" locale="pt-BR" homeHref="/pt-BR" />
    )
    expect(getByRole('heading', { level: 1 })).toHaveTextContent('Obrigado, Carlos!')
  })

  it('botão share está disabled', () => {
    const { container } = render(
      <ThankYouMessage name="Carlos" locale="pt-BR" homeHref="/pt-BR" />
    )
    const buttons = container.querySelectorAll('button')
    const shareButton = Array.from(buttons).find((b) => b.disabled)
    expect(shareButton).toBeTruthy()
  })
})
