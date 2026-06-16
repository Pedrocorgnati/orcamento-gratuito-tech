import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

type CronAuthResult = { ok: true } | { ok: false; response: NextResponse }

/**
 * P2-6: valida `Authorization: Bearer ${CRON_SECRET}` em TEMPO CONSTANTE.
 *
 * Antes cada cron comparava o header com `!==` (canal lateral de timing) e
 * relia `process.env.CRON_SECRET` inline. Este helper centraliza:
 *   - CRON_SECRET ausente  -> 500 (misconfiguration), loga `${event}_misconfigured`.
 *   - header inválido      -> 401, loga `${event}_unauthorized` (sem vazar segredo/IP).
 *
 * A Vercel injeta o header automaticamente ao acionar o cron agendado.
 * Comprimentos diferentes retornam 401 sem chamar timingSafeEqual (que exige
 * buffers de mesmo tamanho) — a própria diferença de tamanho não é segredo útil.
 */
export function assertCronAuth(request: Request, event: string): CronAuthResult {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    logger.error(`${event}_misconfigured`, { detail: 'CRON_SECRET não configurado' })
    return {
      ok: false,
      response: NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 }),
    }
  }

  const provided = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  const valid = provided.length === expected.length && timingSafeEqual(provided, expected)

  if (!valid) {
    logger.warn(`${event}_unauthorized`, {})
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { ok: true }
}
