/**
 * Testes Unitários — CurrencySelector (lógica de conversão de moeda)
 * Rastreabilidade: TASK-1 ST003, GAP-05
 */

import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { CurrencySelector } from '@/components/result/CurrencySelector'
import { Currency } from '@/lib/enums'
import type { ExchangeRateItem } from '@/lib/types'

const mockRates: ExchangeRateItem[] = [
  { from_currency: 'BRL', to_currency: 'USD', rate: 0.2 },
  { from_currency: 'BRL', to_currency: 'EUR', rate: 0.18 },
]

describe('CurrencySelector — Conversão de moeda', () => {
  it('chama onCurrencyChange com valores convertidos ao selecionar USD', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <CurrencySelector
        defaultCurrency={Currency.BRL}
        priceMinBrl={10000}
        priceMaxBrl={20000}
        exchangeRates={mockRates}
        locale="pt-BR"
        onCurrencyChange={onChange}
      />
    )

    fireEvent.change(getByLabelText('Selecionar moeda'), { target: { value: 'USD' } })

    expect(onChange).toHaveBeenCalledWith(Currency.USD, 2000, 4000) // 10000*0.2, 20000*0.2
  })

  it('mantém valores BRL quando taxa de câmbio ausente', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <CurrencySelector
        defaultCurrency={Currency.BRL}
        priceMinBrl={10000}
        priceMaxBrl={20000}
        exchangeRates={[]} // sem taxas
        locale="pt-BR"
        onCurrencyChange={onChange}
      />
    )

    fireEvent.change(getByLabelText('Selecionar moeda'), { target: { value: 'USD' } })

    // Fallback: mantém valores BRL quando taxa ausente
    expect(onChange).toHaveBeenCalledWith(Currency.USD, 10000, 20000)
  })

  it('preserva priceMin < priceMax após conversão', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <CurrencySelector
        defaultCurrency={Currency.BRL}
        priceMinBrl={15000}
        priceMaxBrl={21000}
        exchangeRates={mockRates}
        locale="pt-BR"
        onCurrencyChange={onChange}
      />
    )

    fireEvent.change(getByLabelText('Selecionar moeda'), { target: { value: 'EUR' } })

    const [, min, max] = onChange.mock.calls[0]
    expect(min).toBeLessThan(max)
    expect(min).toBe(Math.round(15000 * 0.18)) // 2700
    expect(max).toBe(Math.round(21000 * 0.18)) // 3780
  })

  it('retorna valores BRL originais ao selecionar BRL de volta', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <CurrencySelector
        defaultCurrency={Currency.BRL}
        priceMinBrl={10000}
        priceMaxBrl={20000}
        exchangeRates={mockRates}
        locale="pt-BR"
        onCurrencyChange={onChange}
      />
    )

    // Troca para USD e volta para BRL
    const select = getByLabelText('Selecionar moeda')
    fireEvent.change(select, { target: { value: 'USD' } })
    fireEvent.change(select, { target: { value: 'BRL' } })

    expect(onChange).toHaveBeenLastCalledWith(Currency.BRL, 10000, 20000)
  })
})

describe('CurrencySelector — Localização', () => {
  it('exibe label "Exibir em:" para pt-BR', () => {
    const { getByText } = render(
      <CurrencySelector
        defaultCurrency={Currency.BRL}
        priceMinBrl={10000}
        priceMaxBrl={20000}
        exchangeRates={[]}
        locale="pt-BR"
      />
    )
    expect(getByText('Exibir em:')).toBeDefined()
  })

  it('exibe label "Display in:" para en-US', () => {
    const { getByText } = render(
      <CurrencySelector
        defaultCurrency={Currency.BRL}
        priceMinBrl={10000}
        priceMaxBrl={20000}
        exchangeRates={[]}
        locale="en-US"
      />
    )
    expect(getByText('Display in:')).toBeDefined()
  })

  it('tem aria-label localizado para it-IT', () => {
    const { getByLabelText } = render(
      <CurrencySelector
        defaultCurrency={Currency.BRL}
        priceMinBrl={10000}
        priceMaxBrl={20000}
        exchangeRates={[]}
        locale="it-IT"
      />
    )
    expect(getByLabelText('Seleziona valuta')).toBeDefined()
  })
})
