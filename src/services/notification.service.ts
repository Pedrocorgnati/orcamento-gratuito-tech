export type NotificationPayload = {
  leadId: string
  leadName: string
  leadEmail: string
  leadPhone?: string
  leadCompany?: string
  projectType: string
  score: string
  estimatedPriceMin: number
  estimatedPriceMax: number
  currency: string
  locale: string
}

export class NotificationService {
  async sendLeadEmails(payload: NotificationPayload): Promise<void> {
    // TODO: Implementar via /auto-flow execute
    // Fluxo com retry exponencial (1s → 4s → 16s, max 3 tentativas):
    // 1. Atualizar lead.email_status = 'retrying'
    // 2. sendOwnerNotification(payload) via Resend
    // 3. sendLeadConfirmation(payload) via Resend
    // 4. Atualizar lead.email_status = 'sent' em sucesso
    // 5. Em falha após 3 retries: atualizar email_status = 'failed'
    throw new Error('Not implemented - run /auto-flow execute')
  }

  async sendOwnerNotification(payload: NotificationPayload): Promise<void> {
    // TODO: Implementar via /auto-flow execute
    // Enviar email para process.env.ADMIN_EMAIL via Resend
    // Template: notificação de novo lead com score e dados do projeto
    throw new Error('Not implemented - run /auto-flow execute')
  }

  async sendLeadConfirmation(payload: NotificationPayload): Promise<void> {
    // TODO: Implementar via /auto-flow execute
    // Enviar email para payload.leadEmail via Resend
    // Template: confirmação i18n baseada em payload.locale
    // Incluir estimativa e scope_story
    throw new Error('Not implemented - run /auto-flow execute')
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    // TODO: Implementar via /auto-flow execute
    // Delays: [1000, 4000, 16000] ms (exponencial 4x)
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (err) {
        if (attempt === maxRetries - 1) throw err
        const delay = Math.pow(4, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
    throw new Error('Max retries exceeded')
  }
}

export const notificationService = new NotificationService()
