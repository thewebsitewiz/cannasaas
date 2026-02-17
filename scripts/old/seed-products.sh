#!/usr/bin/env bash
# ============================================================
# CannaSaas — Seed 30–50 Products per Dispensary
# Realistic cannabis product names, prices, THC/CBD values
# ============================================================

set -e

echo "🌱 Seeding products for all dispensaries..."
echo ""

# -----------------------------------------------------------
# Product templates per category type
# Format: "Name|product_type|strain_type|thc_low|thc_high|cbd_low|cbd_high|price_low|price_high|manufacturer"
# -----------------------------------------------------------

FLOWER_PRODUCTS=(
  "Blue Dream|flower|hybrid|18|24|0.1|1.0|25|55|Highland Farms"
  "OG Kush|flower|indica|20|26|0.1|0.5|30|60|Kush Co"
  "Sour Diesel|flower|sativa|19|25|0.2|0.8|28|52|Diesel Gardens"
  "Girl Scout Cookies|flower|hybrid|22|28|0.1|0.3|35|65|Cookie Factory"
  "Northern Lights|flower|indica|16|22|0.1|0.6|22|48|Aurora Growers"
  "Jack Herer|flower|sativa|18|24|0.1|0.5|28|55|Herer Heritage"
  "Granddaddy Purple|flower|indica|17|23|0.2|0.7|26|50|Purple Reign"
  "Green Crack|flower|sativa|15|21|0.1|0.4|24|45|Emerald Labs"
  "Gelato|flower|hybrid|20|25|0.1|0.3|32|58|Gelato Gardens"
  "Wedding Cake|flower|hybrid|21|27|0.1|0.4|34|62|Cake House"
  "Pineapple Express|flower|hybrid|17|24|0.2|0.6|26|50|Tropical Grows"
  "White Widow|flower|hybrid|18|25|0.1|0.5|28|52|Dutch Heritage"
  "Zkittlez|flower|indica|19|23|0.1|0.4|30|55|Rainbow Farms"
  "Durban Poison|flower|sativa|15|20|0.2|0.8|22|42|African Roots"
  "Bubba Kush|flower|indica|17|22|0.1|0.5|25|48|Bubba Bros"
)

EDIBLE_PRODUCTS=(
  "Gummy Bears 10pk|edible|hybrid|5|10|0|2|15|35|Sweet Leaf Co"
  "Dark Chocolate Bar|edible|indica|10|20|0|5|18|40|Canna Confections"
  "Sour Worms|edible|sativa|5|10|0|1|12|28|Worm Works"
  "Peanut Butter Cups|edible|hybrid|10|15|0|2|16|32|Nutty Buds"
  "Mint Chocolates 6pk|edible|indica|5|10|0|3|14|30|Mint Magic"
  "Fruit Chews Assorted|edible|sativa|5|10|0|1|10|25|Chew Crew"
  "Caramel Squares|edible|hybrid|10|20|0|2|15|35|Caramel Cannabis"
  "Lemonade Drops|edible|sativa|5|10|2|5|12|28|Citrus Labs"
  "Brownie Bites 4pk|edible|indica|15|25|0|2|18|38|Bakers Best"
  "CBD Honey Sticks|edible|cbd|0|1|10|25|8|22|Bee Calm"
)

CONCENTRATE_PRODUCTS=(
  "Live Resin Badder|concentrate|hybrid|65|80|0.5|2|40|70|Extract Elite"
  "Shatter OG|concentrate|indica|70|85|0.1|1|35|65|Shatter House"
  "Wax Sativa Blend|concentrate|sativa|60|75|0.2|1|32|58|Wax Works"
  "Diamonds and Sauce|concentrate|hybrid|80|95|0.1|0.5|55|90|Diamond Labs"
  "Rosin Press|concentrate|indica|60|78|0.3|1.5|45|80|Press Perfect"
  "Crumble Jack|concentrate|sativa|65|80|0.1|1|38|65|Crumble Co"
  "RSO Syringe 1g|concentrate|indica|55|70|2|8|30|55|Ricks Garden"
  "Hash Rosin|concentrate|hybrid|70|85|0.2|1|50|85|Solventless Co"
)

PREROLL_PRODUCTS=(
  "Classic Joint 1g|pre_roll|hybrid|18|24|0.1|0.5|8|15|Roll House"
  "King Size 1.5g|pre_roll|sativa|16|22|0.2|0.6|10|18|King Rollers"
  "Infused Pre-Roll|pre_roll|indica|30|45|0.1|0.3|14|25|Infuse Co"
  "Mini 5-Pack|pre_roll|hybrid|15|20|0.1|0.5|18|32|Mini Rolls"
  "CBD Pre-Roll 1g|pre_roll|cbd|0|2|12|18|6|14|Calm Rolls"
  "Blunt Wrap 2g|pre_roll|indica|18|25|0.1|0.4|12|22|Blunt Force"
  "Sativa Slim 0.5g|pre_roll|sativa|17|23|0.1|0.5|5|10|Slim Jims"
)

VAPE_PRODUCTS=(
  "Live Resin Cart 1g|vape|hybrid|75|88|0.5|2|40|65|Vape Valley"
  "Distillate Cart 0.5g|vape|sativa|80|92|0.1|1|25|45|Distill Pro"
  "Full Spectrum Pod|vape|indica|65|80|1|3|35|55|Spectrum Labs"
  "Disposable Pen 0.3g|vape|hybrid|70|85|0.2|1|15|30|Puff Co"
  "CBD Vape Cart|vape|cbd|0|2|50|70|20|40|CBD Clouds"
  "Sauce Cart 1g|vape|indica|70|85|0.3|1.5|38|60|Sauce Boss"
  "Terp Pen 0.5g|vape|sativa|72|88|0.1|1|28|48|Terp Town"
)

TINCTURE_PRODUCTS=(
  "Full Spectrum 1000mg|tincture|hybrid|0|5|15|30|35|65|Tincture Labs"
  "Sleep Formula 500mg|tincture|indica|5|10|10|20|28|50|Dream Drops"
  "Energy Drops 500mg|tincture|sativa|8|15|2|5|25|45|Uplift Co"
  "CBD Isolate 1500mg|tincture|cbd|0|0|40|60|40|70|Pure CBD Co"
  "1to1 Balance 1000mg|tincture|hybrid|10|15|10|15|38|60|Balance Labs"
  "Pet Tincture 250mg|tincture|cbd|0|0|8|15|18|35|Paws and Calm"
)

TOPICAL_PRODUCTS=(
  "Pain Relief Cream|topical|hybrid|0|2|5|15|20|45|Relief Works"
  "CBD Balm 500mg|topical|cbd|0|0|15|25|18|38|Balm Botanics"
  "Muscle Rub|topical|indica|2|5|5|10|22|42|Muscle Melt"
  "Bath Bomb 100mg|topical|hybrid|0|5|5|10|8|18|Soak and Heal"
  "Transdermal Patch|topical|indica|5|10|2|5|12|28|PatchWorks"
  "Lip Balm CBD|topical|cbd|0|0|5|10|5|12|Lip Leaf"
)

ACCESSORY_PRODUCTS=(
  "Glass Pipe|accessory||0|0|0|0|15|45|GlassWorks"
  "Rolling Papers 50pk|accessory||0|0|0|0|3|8|Raw Papers"
  "Grinder 4-Piece|accessory||0|0|0|0|18|55|Grind King"
  "Stash Jar UV|accessory||0|0|0|0|12|30|StashSafe"
  "Dab Tool Kit|accessory||0|0|0|0|20|50|Dab Depot"
  "Humidity Pack 5pk|accessory||0|0|0|0|8|15|Boveda"
  "Rolling Tray|accessory||0|0|0|0|10|35|Tray Masters"
  "Lighter Torch|accessory||0|0|0|0|12|28|Flame Co"
)

# -----------------------------------------------------------
# Helpers
# -----------------------------------------------------------

rand_between() {
  echo $(( RANDOM % ($2 - $1 + 1) + $1 ))
}

rand_price() {
  local dollars=$(( RANDOM % ($2 - $1 + 1) + $1 ))
  local cents=$(( RANDOM % 100 ))
  printf "%d.%02d" "$dollars" "$cents"
}

rand_thc_cbd() {
  # Takes low and high as floats like "0.1" "1.0", returns a random decimal
  local lo_str=$1 hi_str=$2
  # Convert to integer tenths
  local lo_int=$(echo "$lo_str" | awk '{printf "%d", $1 * 10}')
  local hi_int=$(echo "$hi_str" | awk '{printf "%d", $1 * 10}')
  if [ "$lo_int" -eq 0 ] && [ "$hi_int" -eq 0 ]; then
    echo "0"
    return
  fi
  if [ "$hi_int" -le "$lo_int" ]; then
    hi_int=$(( lo_int + 1 ))
  fi
  local val=$(( RANDOM % (hi_int - lo_int + 1) + lo_int ))
  local whole=$(( val / 10 ))
  local frac=$(( val % 10 ))
  echo "${whole}.${frac}"
}

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//'
}

# Map category slug prefix to product array name
get_products_for_category() {
  case "$1" in
    flower)       echo "FLOWER_PRODUCTS" ;;
    edibles)      echo "EDIBLE_PRODUCTS" ;;
    concentrates) echo "CONCENTRATE_PRODUCTS" ;;
    pre-rolls)    echo "PREROLL_PRODUCTS" ;;
    vapes)        echo "VAPE_PRODUCTS" ;;
    tinctures)    echo "TINCTURE_PRODUCTS" ;;
    topicals)     echo "TOPICAL_PRODUCTS" ;;
    accessories)  echo "ACCESSORY_PRODUCTS" ;;
    *)            echo "" ;;
  esac
}

# -----------------------------------------------------------
# Main
# -----------------------------------------------------------

# Get organization IDs per dispensary (via company -> org chain)
DISPENSARY_DATA=$(docker exec cannasaas-postgres psql -U postgres -d cannasaas -t -A -c "
  SELECT d.id, d.slug, c.organization_id
  FROM dispensaries d
  JOIN companies c ON d.company_id = c.id
  ORDER BY d.name;
")

if [ -z "$DISPENSARY_DATA" ]; then
  echo "❌ No dispensaries found."
  exit 1
fi

DISP_COUNT=$(echo "$DISPENSARY_DATA" | wc -l | tr -d ' ')
echo "   Found $DISP_COUNT dispensaries"

SKU_COUNTER=1000
SQL="INSERT INTO products (id, organization_id, dispensary_id, category_id, name, slug, description, sku, price, category, product_type, strain_type, thc_content, cbd_content, manufacturer, is_active, created_at, updated_at) VALUES"
VALUES=""
TOTAL_PRODUCTS=0

while IFS= read -r drow; do
  DISP_ID=$(echo "$drow" | cut -d'|' -f1)
  DISP_SLUG=$(echo "$drow" | cut -d'|' -f2)
  ORG_ID=$(echo "$drow" | cut -d'|' -f3)

  # Get this dispensary's categories (id, name, slug)
  CATS=$(docker exec cannasaas-postgres psql -U postgres -d cannasaas -t -A -c \
    "SELECT id, name, slug FROM categories WHERE dispensary_id='${DISP_ID}' AND is_active=true;")

  if [ -z "$CATS" ]; then
    echo "   ⚠️  Skipping ${DISP_SLUG} — no categories"
    continue
  fi

  CAT_COUNT=$(echo "$CATS" | wc -l | tr -d ' ')
  TARGET=$(rand_between 30 50)
  PER_CAT=$(( TARGET / CAT_COUNT ))
  REMAINDER=$(( TARGET % CAT_COUNT ))
  DISP_PRODUCT_COUNT=0

  while IFS= read -r crow; do
    CAT_ID=$(echo "$crow" | cut -d'|' -f1)
    CAT_NAME=$(echo "$crow" | cut -d'|' -f2)
    CAT_SLUG=$(echo "$crow" | cut -d'|' -f3)

    # Extract base slug (before the dispensary suffix)
    BASE_SLUG=$(echo "$CAT_SLUG" | sed "s/-${DISP_SLUG}$//")

    ARRAY_NAME=$(get_products_for_category "$BASE_SLUG")
    if [ -z "$ARRAY_NAME" ]; then
      continue
    fi

    # How many for this category
    THIS_COUNT=$PER_CAT
    if [ $REMAINDER -gt 0 ]; then
      THIS_COUNT=$(( THIS_COUNT + 1 ))
      REMAINDER=$(( REMAINDER - 1 ))
    fi

    # Get the product templates
    eval "TEMPLATES=(\"\${${ARRAY_NAME}[@]}\")"
    TEMPLATE_COUNT=${#TEMPLATES[@]}

    for (( i=0; i<THIS_COUNT; i++ )); do
      T_IDX=$(( i % TEMPLATE_COUNT ))
      TEMPLATE="${TEMPLATES[$T_IDX]}"

      P_NAME=$(echo "$TEMPLATE" | cut -d'|' -f1)
      P_TYPE=$(echo "$TEMPLATE" | cut -d'|' -f2)
      P_STRAIN=$(echo "$TEMPLATE" | cut -d'|' -f3)
      THC_LO=$(echo "$TEMPLATE" | cut -d'|' -f4)
      THC_HI=$(echo "$TEMPLATE" | cut -d'|' -f5)
      CBD_LO=$(echo "$TEMPLATE" | cut -d'|' -f6)
      CBD_HI=$(echo "$TEMPLATE" | cut -d'|' -f7)
      PRICE_LO=$(echo "$TEMPLATE" | cut -d'|' -f8)
      PRICE_HI=$(echo "$TEMPLATE" | cut -d'|' -f9)
      MANUFACTURER=$(echo "$TEMPLATE" | cut -d'|' -f10)

      # Generate values
      SKU="SKU-$(printf '%05d' $SKU_COUNTER)"
      SKU_COUNTER=$(( SKU_COUNTER + 1 ))
      PRICE=$(rand_price "$PRICE_LO" "$PRICE_HI")

      THC=$(rand_thc_cbd "$THC_LO" "$THC_HI")
      CBD=$(rand_thc_cbd "$CBD_LO" "$CBD_HI")

      # Unique slug per product
      PROD_SLUG="$(slugify "$P_NAME")-${SKU_COUNTER}"

      # Escape single quotes
      SAFE_NAME=$(echo "$P_NAME" | sed "s/'/''/g")
      SAFE_MFR=$(echo "$MANUFACTURER" | sed "s/'/''/g")
      DESC="Premium $(echo "$CAT_NAME" | tr '[:upper:]' '[:lower:]') product - ${SAFE_NAME}"

      # Strain SQL
      if [ -z "$P_STRAIN" ] || [ "$P_TYPE" = "accessory" ]; then
        STRAIN_SQL="NULL"
      else
        STRAIN_SQL="'${P_STRAIN}'"
      fi

      if [ -n "$VALUES" ]; then
        VALUES="${VALUES},"
      fi
      VALUES="${VALUES}
  (gen_random_uuid(), '${ORG_ID}', '${DISP_ID}', '${CAT_ID}', '${SAFE_NAME}', '${PROD_SLUG}', '${DESC}', '${SKU}', ${PRICE}, '${CAT_NAME}', '${P_TYPE}', ${STRAIN_SQL}, ${THC}, ${CBD}, '${SAFE_MFR}', true, NOW(), NOW())"

      DISP_PRODUCT_COUNT=$(( DISP_PRODUCT_COUNT + 1 ))
      TOTAL_PRODUCTS=$(( TOTAL_PRODUCTS + 1 ))
    done

  done <<< "$CATS"

  echo "   ✅ ${DISP_SLUG}: ${DISP_PRODUCT_COUNT} products across ${CAT_COUNT} categories"

done <<< "$DISPENSARY_DATA"

# Execute
SQL="${SQL}${VALUES};"

echo ""
echo "📦 Inserting $TOTAL_PRODUCTS products..."
docker exec cannasaas-postgres psql -U postgres -d cannasaas -c "$SQL" 2>&1

echo ""
echo "✅ Done! Seeded $TOTAL_PRODUCTS products across $DISP_COUNT dispensaries"
echo ""

# Summary
docker exec cannasaas-postgres psql -U postgres -d cannasaas -c "
  SELECT
    category,
    product_type,
    COUNT(*) as count,
    CONCAT('\$', ROUND(AVG(price)::numeric, 2)) as avg_price,
    CONCAT(ROUND(AVG(thc_content)::numeric, 1), '%') as avg_thc
  FROM products
  GROUP BY category, product_type
  ORDER BY category, product_type;
"

docker exec cannasaas-postgres psql -U postgres -d cannasaas -c "SELECT COUNT(*) as total_products FROM products;"
