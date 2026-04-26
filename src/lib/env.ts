import { z, prettifyError } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL é obrigatória"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL deve ser URL válida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY obrigatória"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY obrigatória"),

  // Resend
  RESEND_API_KEY: z
    .string()
    .startsWith("re_", 'RESEND_API_KEY deve começar com "re_"'),
  RESEND_FROM_EMAIL: z
    .string()
    .email("RESEND_FROM_EMAIL deve ser email válido"),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL deve ser email válido"),

  // Cron
  CRON_SECRET: z
    .string()
    .min(16, "CRON_SECRET deve ter pelo menos 16 caracteres"),

  // App
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL deve ser URL válida"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Sentry (error monitoring) — todos opcionais para dev/CI sem DSN
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Notifications — fallback/alerta para dead-letter
  OWNER_BACKUP_EMAIL: z.string().email().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "❌ Variáveis de ambiente inválidas:\n" + prettifyError(parsed.error)
    );
    throw new Error(
      "Configuração de ambiente inválida. Verifique .env.example"
    );
  }

  return parsed.data;
}

// Lazy singleton — valida no primeiro acesso em runtime, não durante build
let _cached: EnvConfig | undefined;

export function env(): EnvConfig {
  if (!_cached) {
    _cached = validateEnv();
  }
  return _cached;
}
