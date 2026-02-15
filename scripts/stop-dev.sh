              #!/bin/bash
# ============================================================
# CannaSaas - Shutdown & Reset Script
# Run from project root: ./stop-dev.sh [--reset]
#
# No flags:   Graceful shutdown, keeps data
# --reset:    Full teardown — removes volumes, data, everything
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

RESET=false
if [ "${1:-}" = "--reset" ]; then
  RESET=true
fi

# -----------------------------------------------
# 1. Stop Node processes (API, Admin, Storefront)
# -----------------------------------------------
echo ""
echo -e "${YELLOW}Stopping Node.js processes...${NC}"

KILLED=0
for PORT in 3000 5173 3001; do
  PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill -SIGTERM 2>/dev/null || true
    echo -e "  ${GREEN}Stopped process on port $PORT${NC}"
    KILLED=$((KILLED + 1))
  fi
done

if [ "$KILLED" -eq 0 ]; then
  echo "  No Node processes running"
fi

# Give processes a moment to exit cleanly
sleep 1

# -----------------------------------------------
# 2. Stop Docker Compose services
# -----------------------------------------------
echo ""
echo -e "${YELLOW}Stopping Docker Compose services...${NC}"

if [ "$RESET" = true ]; then
  docker compose down --remove-orphans -v 2>/dev/null || true
  echo -e "  ${GREEN}Compose services stopped, volumes removed${NC}"
else
  docker compose down --remove-orphans 2>/dev/null || true
  echo -e "  ${GREEN}Compose services stopped${NC}"
fi

# -----------------------------------------------
# 3. Clean up orphaned containers by name
#    (catches containers created outside compose)
# -----------------------------------------------
echo ""
echo -e "${YELLOW}Checking for orphaned containers...${NC}"

ORPHANS=0
for NAME in cannasaas-postgres cannasaas-redis cannasaas-api cannasaas-admin; do
  if docker ps -a --format '{{.Names}}' | grep -q "^${NAME}$"; then
    docker rm -f "$NAME" >/dev/null 2>&1 || true
    echo -e "  ${GREEN}Removed orphan: $NAME${NC}"
    ORPHANS=$((ORPHANS + 1))
  fi
done

if [ "$ORPHANS" -eq 0 ]; then
  echo "  No orphaned containers found"
fi

# -----------------------------------------------
# 4. Full reset (only with --reset flag)
# -----------------------------------------------
if [ "$RESET" = true ]; then
  echo ""
  echo -e "${RED}Full reset mode${NC}"

  # Remove named volumes
  for VOL in cannasaas_postgres_data cannasaas_redis_data; do
    if docker volume ls -q | grep -q "^${VOL}$"; then
      docker volume rm "$VOL" >/dev/null 2>&1 || true
      echo -e "  ${GREEN}Removed volume: $VOL${NC}"
    fi
  done

  # Remove dangling networks
  for NET in $(docker network ls --filter "name=cannasaas" -q 2>/dev/null); do
    docker network rm "$NET" >/dev/null 2>&1 || true
  done
  echo -e "  ${GREEN}Removed cannasaas networks${NC}"

  echo ""
  echo -e "${GREEN}Full reset complete.${NC} Database and Redis data have been wiped."
  echo "Run ./start-dev.sh to start fresh."
else
  echo ""
  echo -e "${GREEN}Shutdown complete.${NC} Database data preserved."
  echo "Run ./start-dev.sh to restart."
fi

echo ""
