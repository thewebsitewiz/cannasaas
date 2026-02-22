#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase E Staff Portal: Master Runner
# File: scaffold-staff.sh
#
# Executes Part 1 and Part 2 in sequence to build the complete
# apps/staff/src tree, then prints a file-count summary.
#
# Usage:
#   bash scaffold-staff.sh [PROJECT_ROOT]
#
# PROJECT_ROOT defaults to current directory.
# =============================================================================

set -euo pipefail
ROOT="${1:-$(pwd)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   CannaSaas — Phase E: Staff Portal Full Scaffold          ║"
echo "║   Target: $ROOT/apps/staff/src"
echo "╚═══════════════════════════════════════════════════════════╝"

bash "$SCRIPT_DIR/scaffold-staff-part1.sh" "$ROOT"
bash "$SCRIPT_DIR/scaffold-staff-part2.sh" "$ROOT"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Phase E: Complete File Tree"
echo "════════════════════════════════════════════════════════════"
find "$ROOT/apps/staff/src" -type f | sort | sed "s|$ROOT/||" | sed 's/^/  /'

echo ""
FILE_COUNT=$(find "$ROOT/apps/staff/src" -type f | wc -l | tr -d ' ')
echo "  ✅  $FILE_COUNT files written"
echo ""
