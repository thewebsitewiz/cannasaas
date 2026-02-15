#!/bin/bash
# ============================================================
# CannaSaas — Seed Categories for ALL Dispensaries
# Each dispensary gets 70–100% of the 8 category types
# Slug uniqueness handled by appending dispensary slug
# ============================================================

CATEGORIES=(
  "Flower:flower:1"
  "Edibles:edibles:2"
  "Concentrates:concentrates:3"
  "Pre-Rolls:pre-rolls:4"
  "Vapes:vapes:5"
  "Tinctures:tinctures:6"
  "Topicals:topicals:7"
  "Accessories:accessories:8"
)

TOTAL=${#CATEGORIES[@]}
MIN=$(( TOTAL * 70 / 100 ))  # 5 out of 8 = 62.5%, round to 5

echo "🌱 Seeding categories for all dispensaries..."
echo "   Categories per dispensary: $MIN–$TOTAL (70–100%)"
echo ""

# Get all dispensary IDs and slugs
DISPENSARIES=$(docker exec cannasaas-postgres psql -U postgres -d cannasaas -t -A -c \
  "SELECT id || '|' || slug FROM dispensaries ORDER BY name;")

if [ -z "$DISPENSARIES" ]; then
  echo "❌ No dispensaries found. Seed dispensaries first."
  exit 1
fi

DISP_COUNT=$(echo "$DISPENSARIES" | wc -l | tr -d ' ')
echo "   Found $DISP_COUNT dispensaries"
echo ""

# Build one big INSERT
SQL="INSERT INTO categories (id, dispensary_id, name, slug, sort_order, created_at, updated_at) VALUES"
VALUES=""
TOTAL_CATS=0

while IFS= read -r row; do
  DISP_ID=$(echo "$row" | cut -d'|' -f1)
  DISP_SLUG=$(echo "$row" | cut -d'|' -f2)

  # Random count between MIN and TOTAL
  COUNT=$(( RANDOM % (TOTAL - MIN + 1) + MIN ))

  # Shuffle categories and pick $COUNT of them
  SHUFFLED=$(printf '%s\n' "${CATEGORIES[@]}" | sort -R | head -n "$COUNT")

  while IFS= read -r cat; do
    CAT_NAME=$(echo "$cat" | cut -d: -f1)
    CAT_SLUG=$(echo "$cat" | cut -d: -f2)
    CAT_ORDER=$(echo "$cat" | cut -d: -f3)
    UNIQUE_SLUG="${CAT_SLUG}-${DISP_SLUG}"

    if [ -n "$VALUES" ]; then
      VALUES="${VALUES},"
    fi
    VALUES="${VALUES}
  (gen_random_uuid(), '${DISP_ID}', '${CAT_NAME}', '${UNIQUE_SLUG}', ${CAT_ORDER}, NOW(), NOW())"
    TOTAL_CATS=$((TOTAL_CATS + 1))
  done <<< "$SHUFFLED"

done <<< "$DISPENSARIES"

SQL="${SQL}${VALUES}
ON CONFLICT (slug) DO NOTHING;"

# Execute
docker exec cannasaas-postgres psql -U postgres -d cannasaas -c "$SQL"

echo ""
echo "✅ Seeded $TOTAL_CATS categories across $DISP_COUNT dispensaries"
echo ""

# Summary
docker exec cannasaas-postgres psql -U postgres -d cannasaas -c "
  SELECT d.name AS dispensary, COUNT(c.id) AS categories
  FROM dispensaries d
  LEFT JOIN categories c ON c.dispensary_id = d.id
  GROUP BY d.name
  ORDER BY d.name;
"
