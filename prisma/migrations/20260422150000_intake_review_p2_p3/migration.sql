-- CL-281 pricing_version snapshot
ALTER TABLE "leads" ADD COLUMN "pricing_version" TEXT;
-- CL-113 whatsapp dedicado
ALTER TABLE "leads" ADD COLUMN "whatsapp" TEXT;
-- CL-281 PricingConfig.version
ALTER TABLE "pricing_configs" ADD COLUMN "version" TEXT NOT NULL DEFAULT 'v1';

-- TASK-6: FlowEvent e ConsistencyAlertLog
CREATE TABLE "flow_events" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "block" TEXT,
  "question_id" TEXT,
  "meta" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flow_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "flow_events_event_type_created_at_idx" ON "flow_events"("event_type", "created_at");
CREATE INDEX "flow_events_session_id_idx" ON "flow_events"("session_id");
CREATE INDEX "flow_events_block_idx" ON "flow_events"("block");

CREATE TABLE "consistency_alert_logs" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "alert_type" TEXT NOT NULL,
  "context" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consistency_alert_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "consistency_alert_logs_alert_type_created_at_idx" ON "consistency_alert_logs"("alert_type", "created_at");

-- TASK-7: ErasureRequest
CREATE TABLE "erasure_requests" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "verified_at" TIMESTAMP(3),
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "erasure_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "erasure_requests_token_key" ON "erasure_requests"("token");
CREATE INDEX "erasure_requests_email_idx" ON "erasure_requests"("email");
