import 'server-only'
import { Resend } from 'resend'
import { env } from '@/lib/env'

// Instância singleton do Resend — server-only, nunca exposta ao cliente
export const resendClient = new Resend(env().RESEND_API_KEY)
