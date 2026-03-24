-- Migration: init_schema
-- Module: module-1-setup + module-7-question-schema-seed + module-9-session-management + module-12-lead-capture
-- Data: 2026-01-01
-- Rastreabilidade: MOD-001..MOD-008 (MODULES-CHECKLIST.md)
-- NOTA: Schema inicial aplicado via `prisma db push` antes do histórico de migrations.
--       Esta migration documenta o estado base para rastreabilidade em produção.
--       Execute `prisma migrate resolve --applied 20260101000000_init_schema` para marcar como aplicada.

-- CreateTable questions
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "skip_logic" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable options
CREATE TABLE "options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "next_question_id" TEXT,
    "price_impact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "time_impact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "complexity_impact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- CreateTable question_translations
CREATE TABLE "question_translations" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "help_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "question_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable option_translations
CREATE TABLE "option_translations" (
    "id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "option_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable sessions
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_question_id" TEXT,
    "project_type" TEXT,
    "path_taken" JSONB NOT NULL DEFAULT '[]',
    "accumulated_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accumulated_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accumulated_complexity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "questions_answered" INTEGER NOT NULL DEFAULT 0,
    "progress_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "intermediate_email" TEXT,
    "visitor_ip" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable answers
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_id" TEXT,
    "text_value" TEXT,
    "price_impact_snapshot" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "time_impact_snapshot" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "complexity_impact_snapshot" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "step_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable leads
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "score" TEXT NOT NULL,
    "score_budget" INTEGER NOT NULL,
    "score_timeline" INTEGER NOT NULL,
    "score_profile" INTEGER NOT NULL,
    "score_total" INTEGER NOT NULL,
    "project_type" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "estimated_price_min" DOUBLE PRECISION NOT NULL,
    "estimated_price_max" DOUBLE PRECISION NOT NULL,
    "estimated_days_min" INTEGER NOT NULL,
    "estimated_days_max" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "scope_story" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "consent_given" BOOLEAN NOT NULL,
    "consent_version" TEXT NOT NULL,
    "consent_at" TIMESTAMP(3) NOT NULL,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "honeypot_triggered" BOOLEAN NOT NULL DEFAULT false,
    "is_suspicious" BOOLEAN NOT NULL DEFAULT false,
    "suspicious_pattern" TEXT,
    "email_status" TEXT NOT NULL DEFAULT 'PENDING',
    "email_retry_count" INTEGER NOT NULL DEFAULT 0,
    "email_sent_at" TIMESTAMP(3),
    "anonymized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable exchange_rates
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable pricing_configs
CREATE TABLE "pricing_configs" (
    "id" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "base_price" DOUBLE PRECISION NOT NULL,
    "base_days" INTEGER NOT NULL,
    "complexity_multiplier_low" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "complexity_multiplier_medium" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "complexity_multiplier_high" DOUBLE PRECISION NOT NULL DEFAULT 1.7,
    "complexity_multiplier_very_high" DOUBLE PRECISION NOT NULL DEFAULT 2.2,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pricing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questions_code_key" ON "questions"("code");
CREATE INDEX "questions_block_idx" ON "questions"("block");
CREATE INDEX "questions_block_order_idx" ON "questions"("block", "order");
CREATE INDEX "options_question_id_idx" ON "options"("question_id");
CREATE INDEX "options_next_question_id_idx" ON "options"("next_question_id");
CREATE UNIQUE INDEX "question_translations_question_id_locale_key" ON "question_translations"("question_id", "locale");
CREATE UNIQUE INDEX "option_translations_option_id_locale_key" ON "option_translations"("option_id", "locale");
CREATE INDEX "sessions_status_idx" ON "sessions"("status");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE INDEX "sessions_status_expires_at_idx" ON "sessions"("status", "expires_at");
CREATE UNIQUE INDEX "answers_session_id_question_id_key" ON "answers"("session_id", "question_id");
CREATE INDEX "answers_session_id_idx" ON "answers"("session_id");
CREATE UNIQUE INDEX "leads_session_id_key" ON "leads"("session_id");
CREATE INDEX "leads_score_idx" ON "leads"("score");
CREATE INDEX "leads_project_type_idx" ON "leads"("project_type");
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");
CREATE INDEX "leads_email_status_idx" ON "leads"("email_status");
CREATE INDEX "leads_anonymized_at_idx" ON "leads"("anonymized_at");
CREATE UNIQUE INDEX "exchange_rates_from_currency_to_currency_key" ON "exchange_rates"("from_currency", "to_currency");
CREATE UNIQUE INDEX "pricing_configs_project_type_key" ON "pricing_configs"("project_type");

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "options" ADD CONSTRAINT "options_next_question_id_fkey" FOREIGN KEY ("next_question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "question_translations" ADD CONSTRAINT "question_translations_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "option_translations" ADD CONSTRAINT "option_translations_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_current_question_id_fkey" FOREIGN KEY ("current_question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "answers" ADD CONSTRAINT "answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "answers" ADD CONSTRAINT "answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
