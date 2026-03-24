#!/usr/bin/env node

/**
 * Bundle budget checker — verifica se o build JS total gzipped fica abaixo de 200kb.
 * Uso: node scripts/check-bundle-budget.mjs
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_BYTES = 200 * 1024 // 200kb
const CHUNKS_DIR = join(process.cwd(), '.next', 'static', 'chunks')

function getAllJsFiles(dir) {
  const files = []
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...getAllJsFiles(fullPath))
      } else if (entry.name.endsWith('.js')) {
        files.push(fullPath)
      }
    }
  } catch {
    // Directory might not exist
  }
  return files
}

function main() {
  const jsFiles = getAllJsFiles(CHUNKS_DIR)

  if (jsFiles.length === 0) {
    console.error(
      '  Nenhum arquivo JS encontrado em .next/static/chunks/.\n' +
        '  Execute "next build" antes de rodar este script.'
    )
    process.exit(1)
  }

  let totalRaw = 0
  let totalGzip = 0

  for (const file of jsFiles) {
    const content = readFileSync(file)
    const gzipped = gzipSync(content)
    totalRaw += content.length
    totalGzip += gzipped.length
  }

  const totalGzipKb = (totalGzip / 1024).toFixed(1)
  const budgetKb = (BUDGET_BYTES / 1024).toFixed(0)
  const totalRawKb = (totalRaw / 1024).toFixed(1)

  console.log(`\n  Bundle Budget Check`)
  console.log(`  Files:      ${jsFiles.length} JS chunks`)
  console.log(`  Raw:        ${totalRawKb} KB`)
  console.log(`  Gzipped:    ${totalGzipKb} KB`)
  console.log(`  Budget:     ${budgetKb} KB`)

  if (totalGzip > BUDGET_BYTES) {
    const overBy = ((totalGzip - BUDGET_BYTES) / 1024).toFixed(1)
    console.log(`\n  FAIL — ${overBy} KB acima do budget!\n`)
    process.exit(1)
  } else {
    const underBy = ((BUDGET_BYTES - totalGzip) / 1024).toFixed(1)
    console.log(`\n  PASS — ${underBy} KB abaixo do budget.\n`)
    process.exit(0)
  }
}

main()
