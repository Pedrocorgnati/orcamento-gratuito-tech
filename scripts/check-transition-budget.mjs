#!/usr/bin/env node
/**
 * CL-160: gate opcional de budget de transição entre perguntas.
 *
 * Uso: `node scripts/check-transition-budget.mjs <dataset.json>`
 * Dataset: array de números (duração em ms de cada transição amostrada).
 * Falha se p95 >= 200ms.
 */
import fs from 'node:fs'

const input = process.argv[2]
if (!input) {
  console.error('usage: check-transition-budget.mjs <dataset.json>')
  process.exit(2)
}

const raw = fs.readFileSync(input, 'utf8')
const data = JSON.parse(raw)
if (!Array.isArray(data) || data.some((v) => typeof v !== 'number')) {
  console.error('dataset must be an array of numbers (duration in ms)')
  process.exit(2)
}

if (data.length === 0) {
  console.log('no samples — skipping gate')
  process.exit(0)
}

const sorted = [...data].sort((a, b) => a - b)
const p95Index = Math.floor(sorted.length * 0.95)
const p95 = sorted[Math.min(p95Index, sorted.length - 1)]
const BUDGET_MS = 200

console.log(`samples=${sorted.length} p95=${p95.toFixed(1)}ms budget=${BUDGET_MS}ms`)
if (p95 >= BUDGET_MS) {
  console.error('FAIL: p95 acima do budget')
  process.exit(1)
}
console.log('OK')
