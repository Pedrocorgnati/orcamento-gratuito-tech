# Makefile — Budget Free Tech (Gerado por /dev-bootstrap-create)
# Orquestrador de desenvolvimento local
# Uso: make [target]

.PHONY: help setup reset dev build start test test-all test-e2e lint typecheck db-migrate db-seed db-reset db-push db-studio docker-up docker-down docker-clean test-load-smoke test-load test-load-stress

# Default target
help:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Budget Free Tech — Makefile"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "  SETUP & DEPLOYMENT"
	@echo "    make setup              Setup completo do ambiente local"
	@echo "    make reset              Limpar tudo e reconstruir"
	@echo ""
	@echo "  DESENVOLVIMENTO"
	@echo "    make dev                Inicia dev server (http://localhost:3000)"
	@echo "    make build              Build Next.js para produção"
	@echo "    make start              Inicia servidor em produção"
	@echo ""
	@echo "  TESTES"
	@echo "    make test               Vitest unit & integration (modo rápido)"
	@echo "    make test-all           Todos os testes (unit + integration + E2E)"
	@echo "    make test-e2e           Playwright E2E"
	@echo "    make test-e2e-ui        Playwright com UI interativa"
	@echo ""
	@echo "  VALIDAÇÃO"
	@echo "    make lint               ESLint"
	@echo "    make typecheck          TypeScript type check (tsc)"
	@echo ""
	@echo "  BANCO DE DADOS"
	@echo "    make db-migrate         Criar & aplicar migrations (dev)"
	@echo "    make db-migrate-prod    Aplicar migrations (prod)"
	@echo "    make db-push            Sincronizar schema Prisma com BD"
	@echo "    make db-seed            Recarregar seeds"
	@echo "    make db-reset           Reset completo do BD (⚠️  deleta dados)"
	@echo "    make db-studio          Abrir Prisma Studio"
	@echo ""
	@echo "  DOCKER"
	@echo "    make docker-up          Subir serviços (PostgreSQL + app)"
	@echo "    make docker-down        Parar serviços"
	@echo "    make docker-clean       Parar + remover volumes"
	@echo ""
	@echo "  ANÁLISE"
	@echo "    make bundle-check       Verificar tamanho do bundle"
	@echo "    make bundle-analyze     Análise detalhada do bundle"
	@echo "    make lighthouse         Lighthouse performance (desktop)"
	@echo "    make lighthouse-mobile  Lighthouse performance (mobile)"
	@echo ""
	@echo "  LOAD TESTS (requer k6)"
	@echo "    make test-load-smoke    Smoke test (1 VU, 1 min) por cenário"
	@echo "    make test-load          Carga normal (5 VUs, 5 min)"
	@echo "    make test-load-stress   Stress test (20 VUs, 5 min)"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# === SETUP & DEPLOYMENT ===

setup:
	@./scripts/bootstrap.sh

reset:
	@./scripts/bootstrap.sh --reset

# === DESENVOLVIMENTO ===

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

# === TESTES ===

test:
	npm run test

test-all:
	npm run test:all

test-e2e:
	npm run test:e2e

test-e2e-ui:
	npm run test:e2e:ui

test-e2e-headed:
	npm run test:e2e:headed

test-e2e-report:
	npm run test:e2e:report

# === VALIDAÇÃO ===

lint:
	npm run lint

typecheck:
	npm run typecheck

# === BANCO DE DADOS ===

db-migrate:
	npm run db:migrate

db-migrate-prod:
	npm run db:migrate:prod

db-push:
	npm run db:push

db-seed:
	npm run db:seed

db-reset:
	npm run db:reset

db-studio:
	npm run db:studio

db-generate:
	npm run db:generate

# === DOCKER ===

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-clean:
	docker compose down -v

docker-dev:
	npm run docker:dev

docker-dev-build:
	npm run docker:dev:build

docker-prod-build:
	npm run docker:prod:build

# === ANÁLISE ===

bundle-check:
	npm run bundle:check

bundle-analyze:
	npm run bundle:analyze

lighthouse:
	npm run test:performance

lighthouse-mobile:
	npm run lighthouse:mobile

# === UTILITÁRIOS ===

i18n-validate:
	npm run validate:i18n

graph-validate:
	npm run validate:graph

graph-validate-dry:
	npm run validate:graph:dry

# === LOAD TESTS (requer k6 — brew install k6) ===

test-load-smoke:
	@echo "Executando smoke tests (1 VU, 1 min por cenário)..."
	@for scenario in tests/load/scenarios/*.js; do \
		echo "\n── $$scenario ──"; \
		k6 run --env SCENARIO=smoke --env BASE_URL=$${BASE_URL:-http://localhost:3000} \
			--out json=tests/load/results/smoke-$$(basename $$scenario .js).json \
			"$$scenario"; \
	done

test-load:
	@echo "Executando testes de carga normal (5 VUs, 5 min por cenário)..."
	@for scenario in tests/load/scenarios/*.js; do \
		echo "\n── $$scenario ──"; \
		k6 run --env SCENARIO=default --env BASE_URL=$${BASE_URL:-http://localhost:3000} \
			--out json=tests/load/results/load-$$(basename $$scenario .js).json \
			"$$scenario"; \
	done

test-load-stress:
	@echo "Executando stress tests (20 VUs por cenário)..."
	@for scenario in tests/load/scenarios/*.js; do \
		echo "\n── $$scenario ──"; \
		k6 run --env SCENARIO=stress --env BASE_URL=$${BASE_URL:-http://localhost:3000} \
			--out json=tests/load/results/stress-$$(basename $$scenario .js).json \
			"$$scenario"; \
	done

.DEFAULT_GOAL := help
