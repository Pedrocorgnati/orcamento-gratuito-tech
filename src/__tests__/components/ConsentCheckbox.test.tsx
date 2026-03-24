/**
 * Testes Funcionais — ConsentCheckbox (module-12)
 * Rastreabilidade: INT-090, INT-091, SEC-010, FEAT-LN-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConsentCheckbox } from '@/components/lead/ConsentCheckbox'

const mockRegister = vi.fn().mockReturnValue({
  name: 'test',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
})

// ─────────────────────────────────────────────────────────────────────────────
// INT-090: Checkbox principal NÃO pré-marcado
// ─────────────────────────────────────────────────────────────────────────────

describe('ConsentCheckbox — INT-090 (consentimento explícito)', () => {
  it('checkbox principal tem defaultChecked=false', () => {
    const { container } = render(
      <ConsentCheckbox
        register={mockRegister}
        errors={{}}
        locale="pt-BR"
        privacyPolicyHref="/pt-BR/privacy"
      />
    )
    const checkbox = container.querySelector('#consentGiven') as HTMLInputElement
    expect(checkbox).toBeTruthy()
    expect(checkbox.defaultChecked).toBe(false)
  })

  it('checkbox marketing tem defaultChecked=false', () => {
    const { container } = render(
      <ConsentCheckbox
        register={mockRegister}
        errors={{}}
        locale="pt-BR"
        privacyPolicyHref="/pt-BR/privacy"
      />
    )
    const checkbox = container.querySelector('#marketing_consent') as HTMLInputElement
    expect(checkbox).toBeTruthy()
    expect(checkbox.defaultChecked).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Localização — 4 locales
// ─────────────────────────────────────────────────────────────────────────────

describe('ConsentCheckbox — Localização', () => {
  const locales = [
    { locale: 'pt-BR', privacy: 'Política de Privacidade', marketing: 'Aceito receber comunicações sobre serviços relacionados' },
    { locale: 'en-US', privacy: 'Privacy Policy', marketing: 'I accept to receive communications about related services' },
    { locale: 'es-ES', privacy: 'Política de Privacidad', marketing: 'Acepto recibir comunicaciones sobre servicios relacionados' },
    { locale: 'it-IT', privacy: 'Informativa sulla Privacy', marketing: 'Accetto di ricevere comunicazioni su servizi correlati' },
  ]

  locales.forEach(({ locale, privacy, marketing }) => {
    it(`renderiza textos corretos em ${locale}`, () => {
      const { container } = render(
        <ConsentCheckbox
          register={mockRegister}
          errors={{}}
          locale={locale}
          privacyPolicyHref={`/${locale}/privacy`}
        />
      )
      expect(container.textContent).toContain(privacy)
      expect(container.textContent).toContain(marketing)
    })
  })

  it('usa fallback en-US para locale desconhecido', () => {
    const { container } = render(
      <ConsentCheckbox
        register={mockRegister}
        errors={{}}
        locale="fr-FR"
        privacyPolicyHref="/fr-FR/privacy"
      />
    )
    expect(container.textContent).toContain('Privacy Policy')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Erro de validação
// ─────────────────────────────────────────────────────────────────────────────

describe('ConsentCheckbox — Erro de validação', () => {
  it('exibe mensagem de erro quando consentGiven tem erro', () => {
    const errors = {
      consentGiven: { type: 'required', message: 'Campo obrigatório' },
    }
    const { container } = render(
      <ConsentCheckbox
        register={mockRegister}
        errors={errors}
        locale="pt-BR"
        privacyPolicyHref="/pt-BR/privacy"
      />
    )
    const errorEl = container.querySelector('#consent-error')
    expect(errorEl).toBeTruthy()
    expect(errorEl!.getAttribute('role')).toBe('alert')
  })

  it('exibe sr-only hint quando NÃO há erro', () => {
    const { container } = render(
      <ConsentCheckbox
        register={mockRegister}
        errors={{}}
        locale="pt-BR"
        privacyPolicyHref="/pt-BR/privacy"
      />
    )
    const hint = container.querySelector('#consent-hint')
    expect(hint).toBeTruthy()
    expect(hint!.classList.contains('sr-only')).toBe(true)
  })

  it('link da política de privacidade abre em nova aba', () => {
    const { container } = render(
      <ConsentCheckbox
        register={mockRegister}
        errors={{}}
        locale="pt-BR"
        privacyPolicyHref="/pt-BR/privacy"
      />
    )
    const link = container.querySelector('a[href="/pt-BR/privacy"]') as HTMLAnchorElement
    expect(link).toBeTruthy()
    expect(link.target).toBe('_blank')
    expect(link.rel).toContain('noopener')
  })
})
