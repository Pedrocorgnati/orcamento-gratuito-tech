'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generateErasureToken } from '@/lib/security/erasure'
import { logger } from '@/lib/logger'
import { Resend } from 'resend'

const inputSchema = z.object({
  email: z.string().email(),
  locale: z.string().default('pt-BR'),
})

export interface RequestErasureResult {
  success: boolean
  error?: string
}

export async function requestErasure(formData: FormData): Promise<RequestErasureResult> {
  const parsed = inputSchema.safeParse({
    email: formData.get('email'),
    locale: formData.get('locale') ?? 'pt-BR',
  })
  if (!parsed.success) {
    return { success: false, error: 'invalid_input' }
  }

  const email = parsed.data.email.toLowerCase()
  const token = generateErasureToken()

  await prisma.erasureRequest.create({
    data: { email, token },
  })

  // Fire-and-forget email. Se RESEND_API_KEY ausente, apenas loga.
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'no-reply@example.com'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const confirmUrl = `${appUrl}/${parsed.data.locale}/privacy/erasure-request/confirm/${token}`

  if (apiKey) {
    try {
      const resend = new Resend(apiKey)
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Confirme sua solicitação de exclusão de dados',
        html: `<p>Para confirmar a exclusão dos seus dados, clique no link abaixo (válido por 24h):</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`,
        text: `Para confirmar a exclusão dos seus dados, acesse: ${confirmUrl} (válido por 24h).`,
      })
    } catch (err) {
      logger.error('erasure_email_failed', { error: (err as Error).message })
    }
  } else {
    logger.info('erasure_email_skipped_no_key', { confirmUrl })
  }

  return { success: true }
}
