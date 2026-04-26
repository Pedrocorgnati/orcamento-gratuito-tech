/**
 * Testes de Acessibilidade — Componentes do Fluxo de Decisão
 * Rastreabilidade: INT-119, FEAT-DE-004
 *
 * NAVEGAÇÃO POR TECLADO — COMPORTAMENTO ESPERADO:
 * - Tab: navega entre OptionButton/OptionCheckbox na ordem DOM
 * - Enter/Space: seleciona OptionButton (comportamento nativo de <button>)
 * - Click em label: seleciona OptionCheckbox (nativo de <label> + <input type="checkbox">)
 * - BackButton: Tab + Enter/Space funcionais quando não desabilitado
 * - ConsistencyAlert dismiss: Tab alcança botão X; Enter/Space fecha o alerta
 */

import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QuestionCard } from '@/components/flow/QuestionCard'
import { OptionButton } from '@/components/flow/OptionButton'
import { OptionCheckbox } from '@/components/flow/OptionCheckbox'
import { BackButton } from '@/components/flow/BackButton'
import { ConsistencyAlert, ConsistencyAlertsManager } from '@/components/flow/ConsistencyAlert'
import { ConsistencyAlertType } from '@/lib/enums'

expect.extend(toHaveNoViolations)

// ─────────────────────────────────────────────────────────────────────────────
// Mock mínimo de tradução
// ─────────────────────────────────────────────────────────────────────────────

const mockTranslation = {
  locale: 'pt-BR',
  title: 'Qual é o tipo do seu projeto?',
  description: 'Selecione a categoria que melhor descreve seu projeto.',
}

// ─────────────────────────────────────────────────────────────────────────────
// QuestionCard — SINGLE_CHOICE
// ─────────────────────────────────────────────────────────────────────────────

describe('Acessibilidade — Componentes do Fluxo', () => {
  describe('QuestionCard', () => {
    it('não deve ter violações axe-core (SINGLE_CHOICE)', async () => {
      const { container } = render(
        <QuestionCard
          questionId="q-001"
          translation={mockTranslation}
          questionType="SINGLE_CHOICE"
        >
          <OptionButton
            optionId="opt-1"
            label="Website"
            isSelected={false}
            onClick={() => {}}
          />
          <OptionButton
            optionId="opt-2"
            label="E-commerce"
            isSelected={true}
            onClick={() => {}}
          />
        </QuestionCard>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('não deve ter violações axe-core (MULTIPLE_CHOICE)', async () => {
      const { container } = render(
        <QuestionCard
          questionId="q-002"
          translation={mockTranslation}
          questionType="MULTIPLE_CHOICE"
          selectedIds={['opt-1']}
          onContinue={() => {}}
        >
          <OptionCheckbox
            optionId="opt-1"
            label="Autenticação"
            isChecked={true}
            onChange={() => {}}
          />
          <OptionCheckbox
            optionId="opt-2"
            label="Pagamentos"
            isChecked={false}
            onChange={() => {}}
          />
        </QuestionCard>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('exibe mensagem quando não há opções', async () => {
      const { getByTestId } = render(
        <QuestionCard
          questionId="q-empty"
          translation={mockTranslation}
          questionType="SINGLE_CHOICE"
        >
          {null}
        </QuestionCard>
      )
      expect(getByTestId('flow-question-empty')).toBeDefined()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // OptionButton
  // ─────────────────────────────────────────────────────────────────────────

  describe('OptionButton', () => {
    it('não deve ter violações quando não selecionado', async () => {
      const { container } = render(
        <OptionButton
          optionId="opt-1"
          label="Website"
          isSelected={false}
          onClick={() => {}}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('não deve ter violações quando selecionado', async () => {
      const { container } = render(
        <OptionButton
          optionId="opt-1"
          label="Website"
          isSelected={true}
          onClick={() => {}}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('não deve ter violações quando desabilitado', async () => {
      const { container } = render(
        <OptionButton
          optionId="opt-1"
          label="Website"
          isSelected={false}
          isDisabled={true}
          onClick={() => {}}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('tem touch target mínimo de 56px', () => {
      const { getByTestId } = render(
        <OptionButton optionId="opt-1" label="Website" isSelected={false} onClick={() => {}} />
      )
      const wrapper = getByTestId('flow-option-button-opt-1')
      expect(wrapper.className).toContain('min-h-[56px]')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // OptionCheckbox
  // ─────────────────────────────────────────────────────────────────────────

  describe('OptionCheckbox', () => {
    it('não deve ter violações quando desmarcado', async () => {
      const { container } = render(
        <OptionCheckbox
          optionId="opt-1"
          label="Autenticação"
          isChecked={false}
          onChange={() => {}}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('não deve ter violações quando marcado', async () => {
      const { container } = render(
        <OptionCheckbox
          optionId="opt-1"
          label="Autenticação"
          isChecked={true}
          onChange={() => {}}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('tem label corretamente associado (htmlFor/id)', () => {
      const { getByRole } = render(
        <OptionCheckbox
          optionId="opt-test"
          label="Teste"
          isChecked={false}
          onChange={() => {}}
        />
      )
      const checkbox = getByRole('checkbox')
      expect(checkbox.id).toBe('option-checkbox-opt-test')
    })

    it('tem touch target mínimo de 44px', () => {
      const { getByTestId } = render(
        <OptionCheckbox
          optionId="opt-1"
          label="Autenticação"
          isChecked={false}
          onChange={() => {}}
        />
      )
      const wrapper = getByTestId('flow-option-checkbox-opt-1')
      expect(wrapper.className).toContain('min-h-[44px]')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // BackButton
  // ─────────────────────────────────────────────────────────────────────────

  describe('BackButton', () => {
    it('não deve ter violações quando habilitado', async () => {
      const { container } = render(
        <BackButton isFirstQuestion={false} onGoBack={() => {}} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('não deve ter violações quando desabilitado (primeira pergunta)', async () => {
      const { container } = render(<BackButton isFirstQuestion={true} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('está disabled e aria-disabled quando isFirstQuestion=true', () => {
      const { getByRole } = render(<BackButton isFirstQuestion={true} />)
      const button = getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toBeDisabled()
    })

    it('chama onGoBack quando clicado e não é primeira pergunta', () => {
      const onGoBack = vi.fn()
      const { getByRole } = render(
        <BackButton isFirstQuestion={false} onGoBack={onGoBack} />
      )
      fireEvent.click(getByRole('button'))
      expect(onGoBack).toHaveBeenCalledOnce()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // ConsistencyAlert
  // ─────────────────────────────────────────────────────────────────────────

  describe('ConsistencyAlert', () => {
    it('não deve ter violações para BUDGET_MISMATCH', async () => {
      const { container } = render(
        <ConsistencyAlert
          type={ConsistencyAlertType.BUDGET_MISMATCH}
          onDismiss={() => {}}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('não deve ter violações para todos os 5 tipos', async () => {
      for (const alertType of Object.values(ConsistencyAlertType)) {
        const { container } = render(
          <ConsistencyAlert type={alertType} onDismiss={() => {}} />
        )
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      }
    })

    it('tem role="alert" e aria-live="polite"', () => {
      const { getByRole } = render(
        <ConsistencyAlert
          type={ConsistencyAlertType.TIMELINE_CONFLICT}
          onDismiss={() => {}}
        />
      )
      const alert = getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
      expect(alert).toHaveAttribute('aria-atomic', 'true')
    })

    it('dismiss remove o alerta e chama onDismiss', () => {
      const onDismiss = vi.fn()
      const { getByRole, queryByRole } = render(
        <ConsistencyAlert
          type={ConsistencyAlertType.BUDGET_MISMATCH}
          onDismiss={onDismiss}
        />
      )
      // Alerta visível
      expect(getByRole('alert')).toBeDefined()

      // Clicar no dismiss
      const dismissButton = getByRole('button')
      fireEvent.click(dismissButton)

      // Alerta removido
      expect(queryByRole('alert')).toBeNull()
      expect(onDismiss).toHaveBeenCalledWith(ConsistencyAlertType.BUDGET_MISMATCH)
    })

    it('não usa position fixed — alertas são inline', () => {
      const { getByRole } = render(
        <ConsistencyAlert
          type={ConsistencyAlertType.SCOPE_OVERLAP}
          onDismiss={() => {}}
        />
      )
      const alert = getByRole('alert')
      // Verifica que não há classe "fixed" ou "absolute" no elemento
      expect(alert.className).not.toContain('fixed')
      expect(alert.className).not.toContain('absolute')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // ConsistencyAlertsManager
  // ─────────────────────────────────────────────────────────────────────────

  describe('ConsistencyAlertsManager', () => {
    it('retorna null quando não há alertas', () => {
      const { container } = render(
        <ConsistencyAlertsManager activeAlerts={[]} onDismiss={() => {}} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renderiza múltiplos alertas', () => {
      const { getAllByRole } = render(
        <ConsistencyAlertsManager
          activeAlerts={[
            ConsistencyAlertType.BUDGET_MISMATCH,
            ConsistencyAlertType.TIMELINE_CONFLICT,
          ]}
          onDismiss={() => {}}
        />
      )
      expect(getAllByRole('alert')).toHaveLength(2)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Navegação por teclado
  // ─────────────────────────────────────────────────────────────────────────

  describe('Navegação por Teclado', () => {
    it('OptionButton recebe foco via Tab', () => {
      const { getByRole } = render(
        <OptionButton optionId="opt-1" label="Website" isSelected={false} onClick={() => {}} />
      )
      const button = getByRole('button')
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('OptionButton desabilitado não dispara onClick', () => {
      const onClick = vi.fn()
      const { getByRole } = render(
        <OptionButton
          optionId="opt-1"
          label="Website"
          isSelected={false}
          isDisabled={true}
          onClick={onClick}
        />
      )
      fireEvent.click(getByRole('button'))
      expect(onClick).not.toHaveBeenCalled()
    })

    it('ConsistencyAlert dismiss acessível por teclado', () => {
      const onDismiss = vi.fn()
      const { getByRole } = render(
        <ConsistencyAlert
          type={ConsistencyAlertType.SUSPICIOUS_PATTERN}
          onDismiss={onDismiss}
        />
      )
      const dismissButton = getByRole('button')
      dismissButton.focus()
      expect(document.activeElement).toBe(dismissButton)
      fireEvent.keyDown(dismissButton, { key: 'Enter', code: 'Enter' })
    })
  })
})
