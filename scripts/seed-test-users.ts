/**
 * Seed de Usuários de Teste — Budget Free Engine
 *
 * Gerado por: /create-test-user em 2026-03-23
 *
 * Uso:
 *   npx tsx scripts/seed-test-users.ts
 *
 * Ou adicione ao package.json:
 *   "seed:test-users": "tsx scripts/seed-test-users.ts"
 *   npm run seed:test-users
 *
 * NOTA: Este script está preparado para quando o banco de dados estiver configurado.
 * Por enquanto, apenas documenta a estrutura de teste.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// DADOS DE TESTE
// ─────────────────────────────────────────────────────────────────────────────

interface TestSession {
  locale: string;
  currency: string;
  projectType: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  score: "A" | "B" | "C";
  complexity: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

const testSessions: TestSession[] = [
  {
    locale: "pt-BR",
    currency: "BRL",
    projectType: "WEB_APP",
    name: "Ana Santos",
    email: "ana.santos@empresa-exemplo.com",
    phone: "+55 21 97654-3210",
    company: "TechStartup RJ",
    score: "A",
    complexity: "MEDIUM",
    estimatedPriceMin: 18000,
    estimatedPriceMax: 25000,
    estimatedDaysMin: 60,
    estimatedDaysMax: 90,
  },
  {
    locale: "pt-BR",
    currency: "BRL",
    projectType: "ECOMMERCE",
    name: "Roberto Ferreira",
    email: "roberto.ferreira@loja-sp.com",
    phone: "+55 31 96543-2109",
    company: "Loja Virtual SP",
    score: "B",
    complexity: "HIGH",
    estimatedPriceMin: 22000,
    estimatedPriceMax: 35000,
    estimatedDaysMin: 75,
    estimatedDaysMax: 120,
  },
  {
    locale: "en-US",
    currency: "USD",
    projectType: "WEBSITE",
    name: "Sarah Johnson",
    email: "sarah.johnson@marketing-agency.com",
    phone: "+1 (212) 555-0102",
    company: "Marketing Agency NY",
    score: "C",
    complexity: "LOW",
    estimatedPriceMin: 4000,
    estimatedPriceMax: 8000,
    estimatedDaysMin: 20,
    estimatedDaysMax: 35,
  },
  {
    locale: "es-ES",
    currency: "EUR",
    projectType: "MOBILE_APP",
    name: "Carmen Martinez Ruiz",
    email: "carmen@startup-madrid.es",
    phone: "+34 93 234 56 78",
    company: "Startup Madrid",
    score: "A",
    complexity: "VERY_HIGH",
    estimatedPriceMin: 24000,
    estimatedPriceMax: 45000,
    estimatedDaysMin: 90,
    estimatedDaysMax: 150,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÕES DE SEED
// ─────────────────────────────────────────────────────────────────────────────

async function seedTestSessions() {
  console.log("🌱 Seeding test sessions and leads...");

  for (const testData of testSessions) {
    try {
      // 1. Verificar idempotência: existente?
      const existingLead = await prisma.lead.findFirst({
        where: { email: testData.email },
      });

      if (existingLead) {
        console.log(`  ⏭️  Lead já existe: ${testData.email}`);
        continue;
      }

      // 2. Criar sessão
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      const session = await prisma.session.create({
        data: {
          locale: testData.locale,
          currency: testData.currency,
          project_type: testData.projectType,
          status: "completed",
          questions_answered: 5,
          progress_percentage: 100,
          accumulated_price: (testData.estimatedPriceMin + testData.estimatedPriceMax) / 2,
          accumulated_time: (testData.estimatedDaysMin + testData.estimatedDaysMax) / 2,
          accumulated_complexity: 2, // MEDIUM
          expires_at: expiresAt,
          visitor_ip: "127.0.0.1",
          user_agent: "seed-test-user",
        },
      });

      // 3. Criar lead associado à sessão
      const lead = await prisma.lead.create({
        data: {
          session_id: session.id,
          name: testData.name,
          email: testData.email,
          phone: testData.phone,
          company: testData.company,
          project_type: testData.projectType,
          score: testData.score,
          score_budget: testData.score === "A" ? 85 : testData.score === "B" ? 65 : 45,
          score_timeline: testData.score === "A" ? 80 : testData.score === "B" ? 70 : 50,
          score_profile: testData.score === "A" ? 90 : testData.score === "B" ? 60 : 40,
          score_total: testData.score === "A" ? 85 : testData.score === "B" ? 65 : 45,
          complexity: testData.complexity,
          estimated_price_min: testData.estimatedPriceMin,
          estimated_price_max: testData.estimatedPriceMax,
          estimated_days_min: testData.estimatedDaysMin,
          estimated_days_max: testData.estimatedDaysMax,
          features: JSON.stringify([
            "User authentication",
            "Dashboard",
            "API integration",
          ]),
          scope_story: `${testData.name} está buscando um ${testData.projectType} para sua empresa ${testData.company}. Necessita de uma solução escalável e intuitiva.`,
          locale: testData.locale,
          currency: testData.currency,
          consent_given: true,
          consent_version: "1.0",
          consent_at: new Date(),
          marketing_consent: true,
          email_status: "PENDING",
        },
      });

      console.log(`  ✅ Lead criado: ${lead.email}`);
    } catch (error) {
      console.error(`  ❌ Erro ao criar lead ${testData.email}:`, error);
    }
  }

  console.log(`✅ ${testSessions.length} sessões/leads criadas ou atualizadas`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Iniciando seed de usuários de teste...\n");

  try {
    console.log("⏳ Verificando conexão com banco de dados...");
    // Teste de conexão
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Banco de dados conectado\n");

    // Executar seed
    await seedTestSessions();

    console.log("\n✅ Seed de usuários de teste concluído!");
    console.log("\n📋 Próximos passos:");
    console.log("  1. Abra Prisma Studio: npm run db:studio");
    console.log("  2. Navegue para 'sessions' e 'leads'");
    console.log("  3. Verifique os registros criados");
    console.log("  4. Teste o fluxo: npm run dev");
  } catch (error) {
    console.error("❌ Erro durante seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
