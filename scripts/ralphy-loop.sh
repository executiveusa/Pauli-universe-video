#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$ROOT_DIR/skills"
RALPHY_DIR="$SKILLS_DIR/ralphy"

log() {
  printf '\n🎬 %s\n' "$1"
}

ensure_ralphy() {
  mkdir -p "$SKILLS_DIR"

  if [[ -d "$RALPHY_DIR/.git" ]]; then
    log "Updating existing ralphy checkout"
    git -C "$RALPHY_DIR" pull --ff-only
  else
    log "Cloning ralphy into skills/ralphy"
    git clone https://github.com/michaelshimeles/ralphy.git "$RALPHY_DIR"
  fi
}

run_gate() {
  local prompt_number="$1"
  log "Prompt ${prompt_number}: executing quality gate loop"

  pnpm lint
  pnpm type-check
  pnpm test
  pnpm build

  if [[ -f "$RALPHY_DIR/package.json" ]]; then
    pnpm --dir "$RALPHY_DIR" install --frozen-lockfile=false
    if pnpm --dir "$RALPHY_DIR" run --silent lint >/dev/null 2>&1; then
      pnpm --dir "$RALPHY_DIR" lint
    fi
  fi
}

main() {
  cd "$ROOT_DIR"
  ensure_ralphy

  for prompt in {1..10}; do
    run_gate "$prompt"
  done

  log "Ralphie loop completed for prompts 1-10"
}

main "$@"
