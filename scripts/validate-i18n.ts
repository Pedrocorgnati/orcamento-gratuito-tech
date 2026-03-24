// scripts/validate-i18n.ts
// Valida que todas as chaves do locale master (pt-BR) existem nos outros 3 locales.
// Execução: npm run validate:i18n
import { readFileSync } from 'fs'
import { join } from 'path'

const LOCALES = ['pt-BR', 'en-US', 'es-ES', 'it-IT'] as const
const MESSAGES_DIR = join(process.cwd(), 'messages')
const MASTER_LOCALE = 'pt-BR'
const MIN_KEYS = 150

type Messages = Record<string, unknown>

function flattenKeys(obj: Messages, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      return flattenKeys(value as Messages, fullKey)
    }
    return [fullKey]
  })
}

function loadMessages(locale: string): Messages {
  const filePath = join(MESSAGES_DIR, `${locale}.json`)
  const content = readFileSync(filePath, 'utf-8')
  return JSON.parse(content) as Messages
}

function validateLocale(
  locale: string,
  masterKeys: string[],
): { missing: string[]; total: number } {
  const messages = loadMessages(locale)
  const localeKeys = new Set(flattenKeys(messages))
  const missing = masterKeys.filter((key) => !localeKeys.has(key))
  return { missing, total: localeKeys.size }
}

function main() {
  console.log('🔍 Validando chaves i18n...\n')

  const masterMessages = loadMessages(MASTER_LOCALE)
  const masterKeys = flattenKeys(masterMessages)

  console.log(`📋 Locale master (${MASTER_LOCALE}): ${masterKeys.length} chaves`)

  if (masterKeys.length < MIN_KEYS) {
    console.error(
      `❌ ERRO: Locale master tem ${masterKeys.length} chaves — mínimo esperado: ${MIN_KEYS}`,
    )
    process.exit(1)
  }

  let hasErrors = false

  for (const locale of LOCALES) {
    if (locale === MASTER_LOCALE) continue

    try {
      const { missing, total } = validateLocale(locale, masterKeys)
      if (missing.length > 0) {
        console.error(`❌ ${locale}: ${total} chaves, ${missing.length} FALTANDO:`)
        missing.forEach((key) => console.error(`   - ${key}`))
        hasErrors = true
      } else {
        console.log(`✓ ${locale}: ${total} chaves — OK`)
      }
    } catch (err) {
      console.error(`❌ ${locale}: ERRO ao carregar arquivo — ${err}`)
      hasErrors = true
    }
  }

  if (hasErrors) {
    console.error('\n❌ Validação i18n FALHOU — adicione as chaves faltantes antes do deploy')
    process.exit(1)
  }

  console.log(
    `\n✅ Todas as chaves i18n validadas (${masterKeys.length} chaves em ${LOCALES.length} locales)`,
  )
}

main()
