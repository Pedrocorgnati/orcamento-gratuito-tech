'use server'

import { prisma } from '@/lib/prisma'
import { notificationService } from '@/services/notification.service'

/**
 * SA-005: Server Action wrapper para notificationService.sendLeadEmails().
 * Busca o lead pelo ID e dispara emails de notificação.
 * Fire-and-forget: falha de email não propaga.
 */
export async function sendLeadEmail(leadId: string): Promise<{ success: boolean }> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } })

  if (!lead) {
    throw new Error('Lead não encontrado.')
  }

  try {
    await notificationService.sendLeadEmails(lead)
    return { success: true }
  } catch {
    return { success: false }
  }
}
