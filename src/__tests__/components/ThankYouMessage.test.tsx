/**
 * Testes Funcionais — ThankYouMessage (module-12)
 * Rastreabilidade: TASK-4, FEAT-LN-001
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThankYouMessage } from '@/components/lead/ThankYouMessage'

// ─────────────────────────────────────────────────────────────────────────────
// Personalização com nome
// ─────────────────────────────────────────────────────────────────────────────

describe('ThankYouMessage — Personalização', () => {
  it('exibe nome personalizado no h1 (pt-BR)', () => {
    const { getByRole } = render(
      <ThankYouMessage name="Carlos" locale="pt-BR" homeHref="/pt-BR" />
    )
    expect(getByRole('heading', { level: 1 })).toHaveTextContent('Obrigado, Carlos!')
  })

  it('exibe título genérico quando name é null (pt-BR)', () => {
    const { getByRole } = render(
      <ThankYouMessage name={null} locale="pt-BR" homeHref="/pt-BR" />
    )
    expect(getByRole('heading', { level: 1 })).toHaveTextContent('Obrigado!')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Localização — 4 locales
// ─────────────────────────────────────────────────────────────────────────────

describe('ThankYouMessage — Localização', () => {
  const locales = [
    { locale: 'pt-BR', greeting: 'Obrigado, Ana!', subtitle: 'Sua análise está sendo preparada.', home: 'Voltar ao início' },
    { locale: 'en-US', greeting: 'Thank you, Ana!', subtitle: 'Your analysis is being prepared.', home: 'Back to home' },
    { locale: 'es-ES', greeting: '¡Gracias, Ana!', subtitle: 'Tu análisis está siendo preparado.', home: 'Volver al inicio' },
    { locale: 'it-IT', greeting: 'Grazie, Ana!', subtitle: 'La tua analisi è in fase di preparazione.', home: 'Torna alla home' },
  ]

  locales.forEach(({ locale, greeting, subtitle, home }) => {
    it(`renderiza corretamente em ${locale}`, () => {
      const { getByRole, container } = render(
        <ThankYouMessage name="Ana" locale={locale} homeHref={`/${locale}`} />
      )
      expect(getByRole('heading', { level: 1 })).toHaveTextContent(greeting)
      expect(container.textContent).toContain(subtitle)
      expect(container.textContent).toContain(home)
    })
  })

  it('usa fallback en-US para locale desconhecido', () => {
    const { getByRole } = render(
      <ThankYouMessage name="Test" locale="fr-FR" homeHref="/fr-FR" />
    )
    expect(getByRole('heading', { level: 1 })).toHaveTextContent('Thank you, Test!')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Próximos passos
// ─────────────────────────────────────────────────────────────────────────────

describe('ThankYouMessage — Próximos passos', () => {
  it('renderiza 3 itens na lista de próximos passos', () => {
    const { container } = render(
      <ThankYouMessage name="Carlos" locale="pt-BR" homeHref="/pt-BR" />
    )
    const items = container.querySelectorAll('ul li')
    expect(items.length).toBe(3)
  })

  it('lista tem aria-label localizado', () => {
    const { container } = render(
      <ThankYouMessage name="Carlos" locale="pt-BR" homeHref="/pt-BR" />
    )
    const ul = container.querySelector('ul')
    expect(ul!.getAttribute('aria-label')).toBe('Próximos passos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Botões e links
// ─────────────────────────────────────────────────────────────────────────────

describe('ThankYouMessage — Botões e Links', () => {
  it('botão share está disabled (V1 placeholder)', () => {
    const { container } = render(
      <ThankYouMessage name="Carlos" locale="pt-BR" homeHref="/pt-BR" />
    )
    const buttons = container.querySelectorAll('button')
    const disabledBtn = Array.from(buttons).find((b) => b.disabled)
    expect(disabledBtn).toBeTruthy()
  })

  it('link home aponta para homeHref correto', () => {
    const { container } = render(
      <ThankYouMessage name="Carlos" locale="es-ES" homeHref="/es-ES" />
    )
    const link = container.querySelector('a[href="/es-ES"]')
    expect(link).toBeTruthy()
    expect(link!.textContent).toContain('Volver al inicio')
  })
})
