// src/types/messages.d.ts
// Integração com next-intl TypedTranslations (v4.x)
// Ver: https://next-intl-docs.vercel.app/docs/usage/typescript
//
// Este arquivo garante type-safety para useTranslations() e useMessages().
// TypeScript gera erro de compilação se uma chave de tradução não existir.
//
// Exemplo:
//   const t = useTranslations('common')
//   t('back')    // ✓ existe
//   t('foobar')  // ✗ TypeScript error: "foobar" não existe em IntlMessages["common"]

import type ptBR from '../../messages/pt-BR.json'

// next-intl v4.x: augmentar o módulo 'next-intl' com o tipo das mensagens
declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof ptBR
  }
}
