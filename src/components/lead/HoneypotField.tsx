'use client'

import type { UseFormRegister } from 'react-hook-form'

interface HoneypotFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
}

/**
 * Campo honeypot anti-spam.
 *
 * Regras de implementação (SEC-010):
 * 1. Visualmente oculto com CSS (position:absolute + opacity:0) — NÃO usar display:none
 *    Bots modernos detectam display:none; position:absolute fora da tela é mais eficaz.
 * 2. Nome do campo: '_hp' (consistente com leadSchema)
 * 3. tabIndex={-1} e aria-hidden="true" para ignorar por screen readers e teclado
 * 4. autoComplete="off" para evitar preenchimento automático pelo browser
 * 5. Validado OBRIGATORIAMENTE no servidor em createLead.ts — nunca apenas CSS hidden
 */
export function HoneypotField({ register }: HoneypotFieldProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
        zIndex: -1,
      }}
      aria-hidden="true"
    >
      {/* Label parece legítimo para bots, mas não é exibido */}
      <label htmlFor="_hp">Website</label>
      <input
        id="_hp"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        {...register('_hp')}
      />
    </div>
  )
}
