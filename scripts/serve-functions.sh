#!/usr/bin/env bash
# Run Supabase edge functions locally.
# Usage: bash scripts/serve-functions.sh
#
# Before running:
#   1. Fill in supabase/.env with your real API keys
#   2. Make sure ~/bin/supabase is on PATH (it was installed there by Claude Code)
#      or install via: https://supabase.com/docs/guides/cli/getting-started

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SUPABASE="$HOME/bin/supabase"

if ! command -v "$SUPABASE" &>/dev/null && ! command -v supabase &>/dev/null; then
  echo "supabase CLI not found. Install it or add ~/bin to PATH."
  exit 1
fi

CLI="${SUPABASE:-supabase}"

echo "Starting local edge functions on http://localhost:54321/functions/v1/ ..."
"$CLI" functions serve \
  --env-file "$REPO_ROOT/supabase/.env" \
  --no-verify-jwt
