-- Add DEAD_LETTER lifecycle columns to leads
ALTER TABLE "leads"
  ADD COLUMN IF NOT EXISTS "last_failure_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "dead_letter_at" TIMESTAMP(3);

-- Index on email for dedup/recurrence lookups (TASK-4)
CREATE INDEX IF NOT EXISTS "leads_email_idx" ON "leads"("email");
