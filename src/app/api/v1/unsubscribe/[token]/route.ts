import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * CL-232 — Unsubscribe endpoint (GDPR Art. 7(3) + CAN-SPAM).
 *
 * Two token strategies accepted:
 *  1. Lead.unsubscribe_token  -> sets Lead.unsubscribed_at = now()
 *  2. Session.id (for resume emails where no Lead exists yet)
 *     -> sets resume_email_sent_at = now() + clears intermediate_email
 *
 * Idempotent: repeated calls always return { ok: true } for valid tokens.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await params

  if (!token || typeof token !== 'string' || token.length < 10) {
    return NextResponse.json({ ok: false, reason: 'invalid_token' }, { status: 400 })
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { unsubscribe_token: token },
      select: { id: true, unsubscribed_at: true },
    })

    if (lead) {
      if (!lead.unsubscribed_at) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { unsubscribed_at: new Date() },
        })
        logger.info('lead_unsubscribed', { leadId: lead.id })
      }
      return NextResponse.json({ ok: true, kind: 'lead' })
    }

    const session = await prisma.session.findUnique({
      where: { id: token },
      select: { id: true, intermediate_email: true, resume_email_sent_at: true },
    })

    if (session && session.intermediate_email) {
      await prisma.session.update({
        where: { id: session.id },
        data: {
          resume_email_sent_at: session.resume_email_sent_at ?? new Date(),
          intermediate_email: null,
        },
      })
      logger.info('session_resume_unsubscribed', { sessionId: session.id })
      return NextResponse.json({ ok: true, kind: 'session' })
    }

    return NextResponse.json({ ok: false, reason: 'not_found' }, { status: 404 })
  } catch (error) {
    logger.error('unsubscribe_failed', {
      error: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 500 })
  }
}
