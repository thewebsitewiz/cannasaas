#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase F Master Runner
# File: scaffold-phase-f.sh
#
# Executes Phase F Part 1 and Part 2 in sequence.
# Run AFTER scaffold-api-client.sh (which covers the base hooks).
#
# Usage:
#   chmod +x scaffold-phase-f.sh
#   ./scaffold-phase-f.sh [MONOREPO_ROOT]
# =============================================================================
set -euo pipefail
ROOT="${1:-$(pwd)}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  CannaSaas — Phase F: API Integration Layer          ║"
echo "╚══════════════════════════════════════════════════════╝"

bash "$DIR/scaffold-api-phase-f-part1.sh" "$ROOT"
bash "$DIR/scaffold-api-phase-f-part2.sh" "$ROOT"

echo ""
echo "══════════════════════════════════════════════════════"
echo "  Phase F Complete — packages/api-client/src tree"
echo "══════════════════════════════════════════════════════"
find "$ROOT/packages/api-client/src" -type f | sort | sed "s|$ROOT/||" | sed 's/^/  /'
echo ""
COUNT=$(find "$ROOT/packages/api-client/src" -type f | wc -l | tr -d ' ')
echo "  ✅  $COUNT files in packages/api-client/src"
echo ""
