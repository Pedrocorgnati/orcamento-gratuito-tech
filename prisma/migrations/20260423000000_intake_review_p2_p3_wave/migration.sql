-- Intake Review P2+P3 wave: unsubscribe (CL-232), UTM attribution (CL-250), policy versioning (CL-245)

-- CL-232: unsubscribe token + flag on Lead
ALTER TABLE "leads" ADD COLUMN "unsubscribe_token" TEXT;
UPDATE "leads" SET "unsubscribe_token" = gen_random_uuid()::text WHERE "unsubscribe_token" IS NULL;
ALTER TABLE "leads" ALTER COLUMN "unsubscribe_token" SET NOT NULL;
CREATE UNIQUE INDEX "leads_unsubscribe_token_key" ON "leads"("unsubscribe_token");
ALTER TABLE "leads" ADD COLUMN "unsubscribed_at" TIMESTAMP(3);

-- CL-250: UTM + referrer attribution on Session
ALTER TABLE "sessions" ADD COLUMN "utm_source" TEXT;
ALTER TABLE "sessions" ADD COLUMN "utm_medium" TEXT;
ALTER TABLE "sessions" ADD COLUMN "utm_campaign" TEXT;
ALTER TABLE "sessions" ADD COLUMN "utm_term" TEXT;
ALTER TABLE "sessions" ADD COLUMN "utm_content" TEXT;
ALTER TABLE "sessions" ADD COLUMN "referrer" TEXT;

-- CL-250: UTM + referrer attribution on Lead (herdado da Session)
ALTER TABLE "leads" ADD COLUMN "utm_source" TEXT;
ALTER TABLE "leads" ADD COLUMN "utm_medium" TEXT;
ALTER TABLE "leads" ADD COLUMN "utm_campaign" TEXT;
ALTER TABLE "leads" ADD COLUMN "utm_term" TEXT;
ALTER TABLE "leads" ADD COLUMN "utm_content" TEXT;
ALTER TABLE "leads" ADD COLUMN "referrer" TEXT;

-- CL-245: Privacy policy version accepted at consent
ALTER TABLE "leads" ADD COLUMN "consent_policy_version" TEXT;
