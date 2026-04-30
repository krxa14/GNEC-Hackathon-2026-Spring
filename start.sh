#!/usr/bin/env bash
# ShadowFile — one-command local launcher
# Run: bash start.sh

set -e

BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
RESET="\033[0m"

ok()  { echo -e "${GREEN}✓${RESET} $1"; }
err() { echo -e "${RED}✗ $1${RESET}"; exit 1; }
msg() { echo -e "${BOLD}→ $1${RESET}"; }

echo ""
echo -e "${BOLD}ShadowFile — local setup${RESET}"
echo "────────────────────────────"

# ── 1. Node.js ────────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  err "Node.js not found. Install it from https://nodejs.org (LTS version) then re-run this script."
fi
NODE_VER=$(node -v)
ok "Node.js $NODE_VER"

# ── 2. npm install ────────────────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  msg "Installing dependencies (first run only)..."
  npm install --silent
fi
ok "Dependencies installed"

# ── 3. Ollama (optional but preferred) ───────────────────────────────────────
USE_OLLAMA=false
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3.1:8b}"

if command -v ollama &>/dev/null; then
  USE_OLLAMA=true
  ok "Ollama found"

  # Pull model if not already downloaded
  if ! ollama list 2>/dev/null | grep -q "^${OLLAMA_MODEL}"; then
    msg "Pulling model: ${OLLAMA_MODEL} (one-time download, may take a few minutes)..."
    ollama pull "$OLLAMA_MODEL"
  fi
  ok "Model ready: ${OLLAMA_MODEL}"

  # Start Ollama serve in background if not already running
  if ! curl -s http://localhost:11434 &>/dev/null; then
    msg "Starting Ollama..."
    ollama serve &>/dev/null &
    sleep 2
  fi
  ok "Ollama running at http://localhost:11434"
else
  echo -e "${YELLOW}⚠ Ollama not found — falling back to OpenRouter cloud API${RESET}"
  echo "  To run fully offline: install Ollama from https://ollama.com then re-run."
fi

# ── 4. .env.local ────────────────────────────────────────────────────────────
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local

  if [ "$USE_OLLAMA" = true ]; then
    # Auto-configure Ollama
    sed -i.bak "s|^OLLAMA_BASE_URL=.*|OLLAMA_BASE_URL=http://localhost:11434/v1|" .env.local
    sed -i.bak "s|^#.*OLLAMA_MODEL=.*|OLLAMA_MODEL=${OLLAMA_MODEL}|" .env.local
    rm -f .env.local.bak
    ok ".env.local configured for Ollama"
  else
    echo ""
    echo -e "${YELLOW}No .env.local found. OpenRouter key needed for cloud AI.${RESET}"
    echo "  1. Sign up free at https://openrouter.ai"
    echo "  2. Create a key (no credit card required)"
    read -rp "  Paste your OPENROUTER_API_KEY here (or press Enter to skip): " OR_KEY
    if [ -n "$OR_KEY" ]; then
      sed -i.bak "s|^OPENROUTER_API_KEY=.*|OPENROUTER_API_KEY=${OR_KEY}|" .env.local
      rm -f .env.local.bak
      ok "OpenRouter key saved to .env.local"
    fi
  fi
else
  ok ".env.local already exists"
fi

# ── 5. Launch ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}Starting ShadowFile...${RESET}"
echo "Opening http://localhost:5173"
echo "(Press Ctrl+C to stop)"
echo ""

# Open browser after a short delay
(sleep 2 && \
  if command -v xdg-open &>/dev/null; then xdg-open http://localhost:5173; \
  elif command -v open &>/dev/null; then open http://localhost:5173; \
  fi) &

npm run dev
