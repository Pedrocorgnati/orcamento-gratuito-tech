#!/usr/bin/env bash
# bootstrap.sh — Setup completo do ambiente local
# Gerado por /dev-bootstrap-create (SystemForge)
# Projeto: budget-free-tech
# Uso: ./scripts/bootstrap.sh [--reset|--health]
set -euo pipefail

# === Cores ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[bootstrap]${NC} $*"; }
ok()   { echo -e "${GREEN}[ok]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
err()  { echo -e "${RED}[erro]${NC} $*" >&2; }

# === Pre-requisitos ===
check_prereqs() {
  log "Verificando pre-requisitos..."
  local missing=()

  command -v git >/dev/null 2>&1 || missing+=("git")
  command -v node >/dev/null 2>&1 || missing+=("node")
  command -v npm >/dev/null 2>&1 || missing+=("npm")
  command -v docker >/dev/null 2>&1 || missing+=("docker")
  command -v docker compose >/dev/null 2>&1 || missing+=("docker compose")

  if [ ${#missing[@]} -gt 0 ]; then
    err "Faltando: ${missing[*]}"
    echo ""
    echo "Instale os pre-requisitos:"
    echo "  - Node.js >= 20: https://nodejs.org/"
    echo "  - Docker + Docker Compose: https://www.docker.com/products/docker-desktop"
    echo "  - Git: https://git-scm.com/"
    exit 1
  fi

  ok "Pre-requisitos OK: git, node, npm, docker, docker compose"
}

# === Verificar/copiar .env ===
ensure_env() {
  log "Configurando .env..."

  if [ -f .env ]; then
    ok ".env já existe — pulando cópia"
    return
  fi

  if [ -f .env.example ]; then
    cp .env.example .env
    ok ".env criado a partir de .env.example"
    warn "Revise .env e preencha DATABASE_URL, DIRECT_URL e outras variáveis sensiveis antes de continuar"
  else
    warn ".env.example não encontrado — crie manualmente ou execute /env-creation"
  fi
}

# === Instalar dependências ===
install_deps() {
  log "Instalando dependências..."

  # Detectar package manager baseado em lockfiles
  local pkg_cmd="npm"
  if [ -f pnpm-lock.yaml ]; then
    pkg_cmd="pnpm"
    log "Usando pnpm (detectado pnpm-lock.yaml)"
  elif [ -f yarn.lock ]; then
    pkg_cmd="yarn"
    log "Usando yarn (detectado yarn.lock)"
  else
    log "Usando npm (padrão)"
  fi

  # Instalar dependências
  $pkg_cmd install

  ok "Dependências instaladas"
}

# === Gerar cliente Prisma ===
generate_prisma() {
  log "Gerando cliente Prisma..."
  npm run db:generate
  ok "Cliente Prisma gerado"
}

# === Subir serviços Docker ===
start_services() {
  log "Subindo serviços Docker (PostgreSQL + app)..."
  docker compose up -d

  log "Aguardando PostgreSQL ficar saudável..."
  local max_wait=60
  local waited=0

  while [ $waited -lt $max_wait ]; do
    if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
      break
    fi
    sleep 2
    waited=$((waited + 2))
  done

  if [ $waited -ge $max_wait ]; then
    warn "Timeout esperando PostgreSQL (${max_wait}s)"
    warn "Verifique com: docker compose logs db"
  else
    ok "PostgreSQL rodando e saudável"
  fi
}

stop_services() {
  log "Parando serviços Docker..."
  docker compose down
  ok "Serviços parados"
}

# === Executar migrations ===
run_migrations() {
  log "Executando migrations Prisma..."
  npm run db:migrate:prod
  ok "Migrations aplicadas"
}

# === Executar seeds ===
run_seeds() {
  log "Executando seeds..."
  npm run db:seed
  ok "Seeds aplicados"
}

# === Health check leve ===
check_health() {
  log "Verificando saúde do ambiente..."
  local errors=0

  # Verificar .env
  if [ -f .env ]; then
    ok ".env presente"
  else
    warn ".env ausente"
    errors=$((errors + 1))
  fi

  # Verificar containers rodando
  if docker compose ps --format "table {{.Service}}\t{{.Status}}" 2>/dev/null | grep -q "running"; then
    ok "Containers Docker rodando"
  else
    warn "Containers não estão rodando. Dica: docker compose up -d"
    errors=$((errors + 1))
  fi

  # Verificar banco (tentativa de conexão)
  if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    ok "PostgreSQL acessível"
  else
    warn "PostgreSQL não acessível"
    errors=$((errors + 1))
  fi

  # Verificar node_modules
  if [ -d node_modules ]; then
    ok "node_modules presente"
  else
    warn "node_modules ausente — execute 'npm install' ou este script novamente"
    errors=$((errors + 1))
  fi

  echo ""
  if [ $errors -eq 0 ]; then
    ok "Ambiente saudável ✓"
  else
    warn "$errors problema(s) encontrado(s) — verifique acima"
  fi
}

# === Resumo final ===
show_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  BOOTSTRAP COMPLETO — Budget Free Tech${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "  ✓ Dependências instaladas"
  echo "  ✓ Prisma gerado"
  echo "  ✓ Serviços Docker rodando (PostgreSQL)"
  echo "  ✓ Migrations aplicadas"
  echo "  ✓ Seeds carregados"
  echo ""
  echo "  PRÓXIMOS PASSOS:"
  echo ""
  echo "  1. Iniciar dev server:"
  echo "     npm run dev"
  echo "     Acesso: http://localhost:3000"
  echo ""
  echo "  2. Executar testes:"
  echo "     npm run test           # Vitest unit/integration"
  echo "     npm run test:e2e       # Playwright E2E"
  echo "     npm run test:all       # Todos os testes"
  echo ""
  echo "  3. Parar serviços:"
  echo "     docker compose down"
  echo ""
  echo "  4. Resetar tudo (limpar dados + reinstalar):"
  echo "     ./scripts/bootstrap.sh --reset"
  echo "     ou"
  echo "     make reset"
  echo ""
  echo "  5. Verificar saúde:"
  echo "     ./scripts/bootstrap.sh --health"
  echo ""
  echo "  COMANDOS UTEIS:"
  echo ""
  echo "     make setup              # Setup completo"
  echo "     make dev                # Inicia dev server"
  echo "     make test               # Roda testes unit/integration"
  echo "     make db-migrate         # Executar migrations"
  echo "     make db-seed            # Recarregar seeds"
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# === Reset (limpar tudo) ===
do_reset() {
  warn "RESET: Limpando ambiente local..."
  echo ""

  log "Parando e removendo containers..."
  docker compose down -v 2>/dev/null || true
  ok "Containers removidos"

  log "Limpando diretórios temporários..."
  rm -rf node_modules .next dist build .turbo 2>/dev/null || true
  rm -rf .vitest .playwright 2>/dev/null || true
  ok "Diretórios temporários limpos"

  log "Removendo .env (será recriado)..."
  rm -f .env 2>/dev/null || true
  ok ".env removido"

  warn "Ambiente limpo. Executando setup completo..."
  echo ""

  do_setup
}

# === Setup principal ===
do_setup() {
  log "Iniciando bootstrap completo (budget-free-tech)..."
  echo ""

  check_prereqs
  ensure_env
  install_deps
  generate_prisma
  start_services
  run_migrations
  run_seeds
  check_health
  show_summary
}

# === Entrypoint ===
cd "$(dirname "$0")/.."

case "${1:-}" in
  --reset)
    do_reset
    ;;
  --health)
    check_health
    ;;
  *)
    do_setup
    ;;
esac
