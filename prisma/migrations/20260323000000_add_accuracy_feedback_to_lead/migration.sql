-- Migration: add_accuracy_feedback_to_lead
-- Module: module-16-seo-analytics
-- INTAKE: INT-024 (Acurácia de Estimativas >= 70% — V2)

-- AddColumn: accuracy_feedback ao modelo Lead
-- null = não avaliado, true = estimativa precisa, false = estimativa imprecisa
ALTER TABLE "leads" ADD COLUMN "accuracy_feedback" BOOLEAN;
