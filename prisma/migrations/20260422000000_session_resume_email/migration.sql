-- CL-110 / CL-111 / CL-141 — Email automatico de retomada apos 24h
-- Adiciona controle de agendamento e confirmacao de envio do resume email
-- na tabela sessions. intermediate_email ja existe.

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS resume_email_scheduled_for TIMESTAMP(3) NULL,
  ADD COLUMN IF NOT EXISTS resume_email_sent_at TIMESTAMP(3) NULL;

-- Indice composto para a query de elegibilidade do cron
-- (resume_email_scheduled_for <= NOW() AND resume_email_sent_at IS NULL)
CREATE INDEX IF NOT EXISTS "sessions_resume_email_scheduled_for_resume_email_sent_at_idx"
  ON sessions (resume_email_scheduled_for, resume_email_sent_at);
