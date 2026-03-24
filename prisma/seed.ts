import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { seedQuestions } from "./seeds/questions";
import { seedTranslations } from "./seeds/translations";
import { seedGraph } from "./seeds/graph";
import { seedDevData } from "./seeds/dev-data";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// ─── Exchange Rates ──────────────────────────────────────────────────────────

async function seedExchangeRates() {
  console.log("🌱 Seeding exchange rates...");

  const rates = [
    { from_currency: "BRL", to_currency: "USD", rate: 0.19 },
    { from_currency: "BRL", to_currency: "EUR", rate: 0.18 },
    { from_currency: "USD", to_currency: "EUR", rate: 0.95 },
    // Taxas inversas
    { from_currency: "USD", to_currency: "BRL", rate: 5.26 },
    { from_currency: "EUR", to_currency: "BRL", rate: 5.55 },
    { from_currency: "EUR", to_currency: "USD", rate: 1.05 },
  ];

  for (const rate of rates) {
    await prisma.exchangeRate.upsert({
      where: {
        from_currency_to_currency: {
          from_currency: rate.from_currency,
          to_currency: rate.to_currency,
        },
      },
      update: { rate: rate.rate },
      create: {
        from_currency: rate.from_currency,
        to_currency: rate.to_currency,
        rate: rate.rate,
        updated_by: "seed",
      },
    });
  }

  console.log(`✅ ${rates.length} exchange rates criadas/atualizadas`);
}

// ─── Pricing Configs ─────────────────────────────────────────────────────────

async function seedPricingConfigs() {
  console.log("🌱 Seeding pricing configs...");

  const configs = [
    {
      project_type: "WEBSITE",
      base_price: 8000.0,
      base_days: 30,
      complexity_multiplier_low: 0.8,
      complexity_multiplier_medium: 1.0,
      complexity_multiplier_high: 1.4,
      complexity_multiplier_very_high: 1.9,
    },
    {
      project_type: "ECOMMERCE",
      base_price: 18000.0,
      base_days: 60,
      complexity_multiplier_low: 0.8,
      complexity_multiplier_medium: 1.0,
      complexity_multiplier_high: 1.5,
      complexity_multiplier_very_high: 2.0,
    },
    {
      project_type: "WEB_APP",
      base_price: 25000.0,
      base_days: 90,
      complexity_multiplier_low: 0.75,
      complexity_multiplier_medium: 1.0,
      complexity_multiplier_high: 1.5,
      complexity_multiplier_very_high: 2.2,
    },
    {
      project_type: "MOBILE_APP",
      base_price: 30000.0,
      base_days: 90,
      complexity_multiplier_low: 0.8,
      complexity_multiplier_medium: 1.0,
      complexity_multiplier_high: 1.5,
      complexity_multiplier_very_high: 2.0,
    },
    {
      project_type: "AUTOMATION_AI",
      base_price: 20000.0,
      base_days: 45,
      complexity_multiplier_low: 0.7,
      complexity_multiplier_medium: 1.0,
      complexity_multiplier_high: 1.6,
      complexity_multiplier_very_high: 2.5,
    },
  ];

  for (const config of configs) {
    await prisma.pricingConfig.upsert({
      where: { project_type: config.project_type },
      update: config,
      create: config,
    });
  }

  console.log(`✅ ${configs.length} pricing configs criadas/atualizadas`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Iniciando seed do banco de dados...\n");

  try {
    await seedExchangeRates();
    await seedPricingConfigs();

    console.log("  Semeando perguntas e opções base...");
    await seedQuestions(prisma);
    console.log("  ✅ 42 perguntas criadas/atualizadas");

    console.log("  Semeando traduções (168 QuestionTranslation + ~200 OptionTranslation)...");
    await seedTranslations(prisma);
    console.log("  ✅ Traduções criadas/atualizadas");

    console.log("  Configurando grafo de navegação DAG...");
    await seedGraph(prisma);
    console.log("  ✅ Grafo configurado");

    console.log("  Semeando dados de desenvolvimento (sessões, leads, edge cases)...");
    await seedDevData(prisma);

    console.log("\n✅ Seed concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante o seed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
