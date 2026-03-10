#!/bin/bash

# Run from apps/api
# Usage: ./create-seed-migration.sh
# Then: pnpm migration:run

TIMESTAMP=$(date +%s000)
FILE="src/migrations/${TIMESTAMP}-SeedLookupTables.ts"

mkdir -p src/migrations

cat > "$FILE" << 'MIGRATION'
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedLookupTables1773074426503 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    // ── lkp_product_types ──────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_product_types
        (product_type_id, code, name, requires_lab_test, requires_serving_info, requires_ingredient_list,
         requires_extraction_method, is_inhalable, is_ingestible, metrc_default_category_code,
         hemp_eligible, is_active, sort_order)
      VALUES
        (1,  'FLOWER',       'Cannabis Flower',       true,  false, false, false, true,  false, 'Flower',                     false, true, 1),
        (2,  'PRE_ROLL',     'Pre-Roll',              true,  false, false, false, true,  false, 'Pre-Roll Flower',            false, true, 2),
        (3,  'VAPE',         'Vape Cartridge',        true,  false, false, true,  true,  false, 'Vape Product',               false, true, 3),
        (4,  'CONCENTRATE',  'Concentrate',           true,  false, false, true,  true,  false, 'Concentrate',                false, true, 4),
        (5,  'EDIBLE',       'Edible',                true,  true,  true,  false, false, true,  'Edible',                     false, true, 5),
        (6,  'TINCTURE',     'Tincture',              true,  true,  true,  false, false, true,  'Tincture',                   false, true, 6),
        (7,  'TOPICAL',      'Topical',               false, false, true,  false, false, false, 'Topical',                    false, true, 7),
        (8,  'CAPSULE',      'Capsule / Tablet',      true,  true,  true,  false, false, true,  'Capsule',                    false, true, 8),
        (9,  'BEVERAGE',     'Beverage',              true,  true,  true,  false, false, true,  'Edible',                     false, true, 9),
        (10, 'PATCH',        'Transdermal Patch',     false, true,  false, false, false, true,  'Topical',                    false, true, 10),
        (11, 'SUPPOSITORY',  'Suppository',           false, true,  false, false, false, true,  'Capsule',                    false, true, 11),
        (12, 'HEMP_CBD',     'Hemp-Derived CBD',      true,  false, false, false, false, false, null,                         true,  true, 12),
        (13, 'ACCESSORY',    'Accessory',             false, false, false, false, false, false, null,                         false, true, 13)
      ON CONFLICT (product_type_id) DO NOTHING;
    `);

    // ── lkp_product_categories ─────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_product_categories
        (category_id, parent_category_id, code, name, depth, metrc_category_code, is_active, sort_order)
      VALUES
        -- Top level
        (1,  null, 'FLOWER',          'Flower',              0, 'Flower',            true, 1),
        (2,  null, 'PRE_ROLL',        'Pre-Roll',            0, 'Pre-Roll Flower',   true, 2),
        (3,  null, 'VAPE',            'Vape',                0, 'Vape Product',      true, 3),
        (4,  null, 'CONCENTRATE',     'Concentrate',         0, 'Concentrate',       true, 4),
        (5,  null, 'EDIBLE',          'Edible',              0, 'Edible',            true, 5),
        (6,  null, 'TINCTURE',        'Tincture',            0, 'Tincture',          true, 6),
        (7,  null, 'TOPICAL',         'Topical',             0, 'Topical',           true, 7),
        (8,  null, 'CAPSULE',         'Capsule / Tablet',    0, 'Capsule',           true, 8),
        (9,  null, 'BEVERAGE',        'Beverage',            0, 'Edible',            true, 9),
        -- Flower children
        (10, 1,  'FLOWER_INDICA',     'Indica',              1, 'Flower',            true, 1),
        (11, 1,  'FLOWER_SATIVA',     'Sativa',              1, 'Flower',            true, 2),
        (12, 1,  'FLOWER_HYBRID',     'Hybrid',              1, 'Flower',            true, 3),
        (13, 1,  'FLOWER_CBD',        'High-CBD Flower',     1, 'Flower',            true, 4),
        -- Pre-Roll children
        (14, 2,  'PREROLL_SINGLE',    'Single',              1, 'Pre-Roll Flower',   true, 1),
        (15, 2,  'PREROLL_MULTIPACK', 'Multi-Pack',          1, 'Pre-Roll Flower',   true, 2),
        (16, 2,  'PREROLL_INFUSED',   'Infused',             1, 'Pre-Roll Flower',   true, 3),
        -- Vape children
        (17, 3,  'VAPE_510',          '510 Cartridge',       1, 'Vape Product',      true, 1),
        (18, 3,  'VAPE_AIO',          'All-in-One',          1, 'Vape Product',      true, 2),
        (19, 3,  'VAPE_POD',          'Pod System',          1, 'Vape Product',      true, 3),
        (20, 3,  'VAPE_DISPOSABLE',   'Disposable',          1, 'Vape Product',      true, 4),
        -- Concentrate children
        (21, 4,  'CONC_SHATTER',      'Shatter',             1, 'Concentrate',       true, 1),
        (22, 4,  'CONC_WAX',          'Wax / Budder',        1, 'Concentrate',       true, 2),
        (23, 4,  'CONC_LIVE_RESIN',   'Live Resin',          1, 'Concentrate',       true, 3),
        (24, 4,  'CONC_ROSIN',        'Rosin',               1, 'Concentrate',       true, 4),
        (25, 4,  'CONC_HASH',         'Hash',                1, 'Concentrate',       true, 5),
        (26, 4,  'CONC_KIEF',         'Kief',                1, 'Concentrate',       true, 6),
        (27, 4,  'CONC_OIL',          'Cannabis Oil',        1, 'Concentrate',       true, 7),
        (28, 4,  'CONC_DISTILLATE',   'Distillate',          1, 'Concentrate',       true, 8),
        -- Edible children
        (29, 5,  'EDIBLE_GUMMY',      'Gummies / Candy',     1, 'Edible',            true, 1),
        (30, 5,  'EDIBLE_CHOCOLATE',  'Chocolate',           1, 'Edible',            true, 2),
        (31, 5,  'EDIBLE_BAKED',      'Baked Goods',         1, 'Edible',            true, 3),
        (32, 5,  'EDIBLE_SAVORY',     'Savory Snacks',       1, 'Edible',            true, 4),
        (33, 5,  'EDIBLE_HARD_CANDY', 'Hard Candy / Lozenge',1, 'Edible',            true, 5),
        -- Topical children
        (34, 7,  'TOPICAL_LOTION',    'Lotion / Cream',      1, 'Topical',           true, 1),
        (35, 7,  'TOPICAL_BALM',      'Balm / Salve',        1, 'Topical',           true, 2),
        (36, 7,  'TOPICAL_OIL',       'Body Oil',            1, 'Topical',           true, 3),
        (37, 7,  'TOPICAL_PATCH',     'Transdermal Patch',   1, 'Topical',           true, 4)
      ON CONFLICT (category_id) DO NOTHING;
    `);

    // ── lkp_unit_of_measure ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_unit_of_measure
        (uom_id, code, name, uom_type, is_metrc_supported, metrc_code, is_active)
      VALUES
        (1,  'G',      'Grams',         'weight',  true,  'Grams',           true),
        (2,  'OZ',     'Ounces',        'weight',  true,  'Ounces',          true),
        (3,  'LB',     'Pounds',        'weight',  true,  'Pounds',          true),
        (4,  'MG',     'Milligrams',    'weight',  true,  'Milligrams',      true),
        (5,  'KG',     'Kilograms',     'weight',  true,  'Kilograms',       true),
        (6,  'ML',     'Milliliters',   'volume',  true,  'Milliliters',     true),
        (7,  'FL_OZ',  'Fluid Ounces',  'volume',  false, null,              true),
        (8,  'L',      'Liters',        'volume',  false, null,              true),
        (9,  'EA',     'Each',          'each',    true,  'Each',            true),
        (10, 'DOSE',   'Dose',          'each',    false, null,              true)
      ON CONFLICT (uom_id) DO NOTHING;
    `);

    // ── lkp_packaging_types ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_packaging_types
        (packaging_type_id, code, name, is_child_resistant, is_tamper_evident, is_resealable, is_opaque, is_active)
      VALUES
        (1,  'JAR',         'Glass / Plastic Jar',     true,  false, true,  false, true),
        (2,  'MYLAR_BAG',   'Mylar Bag',               true,  true,  true,  true,  true),
        (3,  'TUBE',        'Pre-Roll Tube',            true,  true,  false, true,  true),
        (4,  'BOTTLE',      'Bottle',                   true,  true,  true,  false, true),
        (5,  'BLISTER',     'Blister Pack',             true,  true,  false, false, true),
        (6,  'POUCH',       'Resealable Pouch',         true,  true,  true,  true,  true),
        (7,  'BOX',         'Box / Carton',             false, false, false, true,  true),
        (8,  'VIAL',        'Vial / Dropper Bottle',    true,  false, true,  false, true),
        (9,  'CARTRIDGE',   'Vape Cartridge',           false, false, false, false, true),
        (10, 'TRAY',        'Tray / Clamshell',         false, false, false, false, true)
      ON CONFLICT (packaging_type_id) DO NOTHING;
    `);

    // ── lkp_extraction_methods ─────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_extraction_methods
        (extraction_method_id, code, name, uses_solvent, solvent_type, is_active)
      VALUES
        (1,  'CO2',           'Supercritical CO2',       true,  'CO2',             true),
        (2,  'BHO',           'Butane Hash Oil (BHO)',   true,  'Butane',          true),
        (3,  'PHO',           'Propane Hash Oil (PHO)',  true,  'Propane',         true),
        (4,  'ETHANOL',       'Ethanol / QWET',          true,  'Ethanol',         true),
        (5,  'ROSIN',         'Solventless Rosin',       false, null,              true),
        (6,  'ICE_WATER',     'Ice Water / Bubble Hash', false, null,              true),
        (7,  'DRY_SIFT',      'Dry Sift / Mechanical',   false, null,              true),
        (8,  'HYDROCARBON',   'Hydrocarbon (Mixed)',      true,  'Hydrocarbon',     true),
        (9,  'DISTILLATION',  'Distillation / Wiped Film',true, 'Various',         true),
        (10, 'WHOLE_PLANT',   'Whole Plant / Full Spec', false, null,              true)
      ON CONFLICT (extraction_method_id) DO NOTHING;
    `);

    // ── lkp_effects ────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_effects
        (effect_id, code, name, effect_category, is_medical_claim, is_active, sort_order)
      VALUES
        (1,  'RELAXED',       'Relaxed',          'mood',       false, true, 1),
        (2,  'HAPPY',         'Happy',            'mood',       false, true, 2),
        (3,  'EUPHORIC',      'Euphoric',         'mood',       false, true, 3),
        (4,  'UPLIFTED',      'Uplifted',         'mood',       false, true, 4),
        (5,  'CREATIVE',      'Creative',         'cognitive',  false, true, 5),
        (6,  'FOCUSED',       'Focused',          'cognitive',  false, true, 6),
        (7,  'ENERGETIC',     'Energetic',        'physical',   false, true, 7),
        (8,  'TALKATIVE',     'Talkative',        'social',     false, true, 8),
        (9,  'GIGGLY',        'Giggly',           'mood',       false, true, 9),
        (10, 'SLEEPY',        'Sleepy',           'physical',   false, true, 10),
        (11, 'HUNGRY',        'Hungry',           'physical',   false, true, 11),
        (12, 'TINGLY',        'Tingly',           'physical',   false, true, 12),
        (13, 'AROUSED',       'Aroused',          'physical',   false, true, 13),
        -- Medical (marked as claims — use with caution in labeling)
        (14, 'PAIN_RELIEF',   'Pain Relief',      'medical',    true,  true, 14),
        (15, 'STRESS_RELIEF', 'Stress Relief',    'medical',    true,  true, 15),
        (16, 'ANTI_ANXIETY',  'Anxiety Relief',   'medical',    true,  true, 16),
        (17, 'ANTI_INSOMNIA', 'Insomnia Relief',  'medical',    true,  true, 17),
        (18, 'ANTI_NAUSEA',   'Nausea Relief',    'medical',    true,  true, 18),
        (19, 'ANTI_INFLAM',   'Anti-Inflammatory','medical',    true,  true, 19),
        (20, 'APPETITE',      'Appetite Stimulation','medical', true,  true, 20),
        -- Negative
        (21, 'DRY_MOUTH',     'Dry Mouth',        'negative',   false, true, 21),
        (22, 'DRY_EYES',      'Dry Eyes',         'negative',   false, true, 22),
        (23, 'PARANOIA',      'Paranoia',         'negative',   false, true, 23),
        (24, 'ANXIOUS',       'Anxious',          'negative',   false, true, 24),
        (25, 'DIZZY',         'Dizzy',            'negative',   false, true, 25),
        (26, 'HEADACHE',      'Headache',         'negative',   false, true, 26)
      ON CONFLICT (effect_id) DO NOTHING;
    `);

    // ── lkp_flavors ────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_flavors
        (flavor_id, code, name, flavor_family, is_active, sort_order)
      VALUES
        (1,  'EARTHY',      'Earthy',         'natural',  true, 1),
        (2,  'WOODY',       'Woody',          'natural',  true, 2),
        (3,  'PINE',        'Pine',           'natural',  true, 3),
        (4,  'FLORAL',      'Floral',         'natural',  true, 4),
        (5,  'HERBAL',      'Herbal',         'natural',  true, 5),
        (6,  'SPICY',       'Spicy / Pepper', 'spice',    true, 6),
        (7,  'PUNGENT',     'Pungent',        'natural',  true, 7),
        (8,  'DIESEL',      'Diesel',         'chemical', true, 8),
        (9,  'CHEMICAL',    'Chemical',       'chemical', true, 9),
        (10, 'AMMONIA',     'Ammonia',        'chemical', true, 10),
        (11, 'CITRUS',      'Citrus',         'fruit',    true, 11),
        (12, 'LEMON',       'Lemon',          'fruit',    true, 12),
        (13, 'LIME',        'Lime',           'fruit',    true, 13),
        (14, 'ORANGE',      'Orange',         'fruit',    true, 14),
        (15, 'GRAPEFRUIT',  'Grapefruit',     'fruit',    true, 15),
        (16, 'BERRY',       'Berry',          'fruit',    true, 16),
        (17, 'BLUEBERRY',   'Blueberry',      'fruit',    true, 17),
        (18, 'STRAWBERRY',  'Strawberry',     'fruit',    true, 18),
        (19, 'GRAPE',       'Grape',          'fruit',    true, 19),
        (20, 'TROPICAL',    'Tropical',       'fruit',    true, 20),
        (21, 'MANGO',       'Mango',          'fruit',    true, 21),
        (22, 'PINEAPPLE',   'Pineapple',      'fruit',    true, 22),
        (23, 'APPLE',       'Apple',          'fruit',    true, 23),
        (24, 'SWEET',       'Sweet',          'sweet',    true, 24),
        (25, 'VANILLA',     'Vanilla',        'sweet',    true, 25),
        (26, 'HONEY',       'Honey',          'sweet',    true, 26),
        (27, 'CANDY',       'Candy',          'sweet',    true, 27),
        (28, 'CHOCOLATE',   'Chocolate',      'sweet',    true, 28),
        (29, 'COFFEE',      'Coffee',         'sweet',    true, 29),
        (30, 'MINT',        'Mint',           'fresh',    true, 30),
        (31, 'MENTHOL',     'Menthol',        'fresh',    true, 31),
        (32, 'LAVENDER',    'Lavender',       'floral',   true, 32),
        (33, 'ROSE',        'Rose',           'floral',   true, 33),
        (34, 'SKUNK',       'Skunk',          'natural',  true, 34),
        (35, 'CHEESE',      'Cheese',         'natural',  true, 35),
        (36, 'NUTTY',       'Nutty',          'natural',  true, 36),
        (37, 'TEA',         'Tea',            'natural',  true, 37)
      ON CONFLICT (flavor_id) DO NOTHING;
    `);

    // ── lkp_terpenes ──────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_terpenes
        (terpene_id, code, name, aroma, potential_effects, boiling_point_celsius, is_active, sort_order)
      VALUES
        (1,  'MYRCENE',       'Myrcene',        'Musky, earthy, herbal',   'Sedating, relaxing, anti-inflammatory',   166.7, true, 1),
        (2,  'LIMONENE',      'Limonene',       'Citrus',                  'Uplifting, anti-anxiety, anti-fungal',    176.0, true, 2),
        (3,  'CARYOPHYLLENE', 'Caryophyllene',  'Spicy, peppery',          'Anti-inflammatory, pain relief, anxiety', 130.0, true, 3),
        (4,  'LINALOOL',      'Linalool',       'Floral, lavender',        'Calming, anti-anxiety, anti-convulsant',  198.0, true, 4),
        (5,  'PINENE',        'Alpha-Pinene',   'Pine',                    'Alertness, memory retention, bronchodilator', 155.0, true, 5),
        (6,  'HUMULENE',      'Humulene',       'Earthy, woody, hoppy',    'Anti-inflammatory, appetite suppressant', 106.0, true, 6),
        (7,  'TERPINOLENE',   'Terpinolene',    'Fresh, floral, herbal',   'Uplifting, anti-oxidant, anti-bacterial', 186.0, true, 7),
        (8,  'OCIMENE',       'Ocimene',        'Sweet, herbal, woody',    'Decongestant, anti-viral, anti-fungal',   50.0,  true, 8),
        (9,  'BISABOLOL',     'Bisabolol',      'Floral, sweet',           'Anti-inflammatory, anti-irritant',        153.0, true, 9),
        (10, 'TERPINEOL',     'Terpineol',      'Floral, lilac',           'Sedating, anti-oxidant, anti-microbial',  217.5, true, 10),
        (11, 'VALENCENE',     'Valencene',      'Sweet, citrus, wood',     'Anti-inflammatory, anti-allergic',        123.0, true, 11),
        (12, 'GERANIOL',      'Geraniol',       'Sweet, rose, fruity',     'Neuroprotectant, anti-inflammatory',      230.0, true, 12),
        (13, 'CAMPHENE',      'Camphene',       'Earthy, damp, pungent',   'Anti-oxidant, cardiovascular',            159.0, true, 13),
        (14, 'BORNEOL',       'Borneol',        'Earthy, camphor',         'Anti-inflammatory, analgesic',            213.0, true, 14),
        (15, 'DELTA3CARENE',  'Delta-3-Carene', 'Sweet, earthy, piney',    'Bone growth stimulant, anti-inflammatory',168.0, true, 15)
      ON CONFLICT (terpene_id) DO NOTHING;
    `);

    // ── lkp_cannabinoids ──────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_cannabinoids
        (cannabinoid_id, code, name, abbreviation, is_psychoactive, is_hemp_restricted, is_scheduled, schedule, is_active)
      VALUES
        (1,  'THC',   'Delta-9 Tetrahydrocannabinol',  'THC',   true,  true,  true,  'Schedule I', true),
        (2,  'CBD',   'Cannabidiol',                   'CBD',   false, false, false, null,          true),
        (3,  'CBG',   'Cannabigerol',                  'CBG',   false, false, false, null,          true),
        (4,  'CBN',   'Cannabinol',                    'CBN',   false, false, false, null,          true),
        (5,  'CBC',   'Cannabichromene',               'CBC',   false, false, false, null,          true),
        (6,  'THCV',  'Tetrahydrocannabivarin',        'THCV',  true,  false, false, null,          true),
        (7,  'CBDV',  'Cannabidivarin',                'CBDV',  false, false, false, null,          true),
        (8,  'CBGA',  'Cannabigerolic Acid',           'CBGA',  false, false, false, null,          true),
        (9,  'THCA',  'Tetrahydrocannabinolic Acid',   'THCA',  false, false, false, null,          true),
        (10, 'CBDA',  'Cannabidiolic Acid',            'CBDA',  false, false, false, null,          true),
        (11, 'D8THC', 'Delta-8 Tetrahydrocannabinol',  'D8-THC',true, false, false, null,          true),
        (12, 'D10THC','Delta-10 Tetrahydrocannabinol', 'D10-THC',true,false, false, null,          true),
        (13, 'THCP',  'Tetrahydrocannabiphorol',       'THCP',  true,  false, false, null,          true)
      ON CONFLICT (cannabinoid_id) DO NOTHING;
    `);

    // ── lkp_allergens ─────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_allergens
        (allergen_id, code, name, is_fda_major, is_active)
      VALUES
        (1,  'MILK',       'Milk / Dairy',   true,  true),
        (2,  'EGGS',       'Eggs',           true,  true),
        (3,  'FISH',       'Fish',           true,  true),
        (4,  'SHELLFISH',  'Shellfish',      true,  true),
        (5,  'TREE_NUTS',  'Tree Nuts',      true,  true),
        (6,  'PEANUTS',    'Peanuts',        true,  true),
        (7,  'WHEAT',      'Wheat / Gluten', true,  true),
        (8,  'SOYBEANS',   'Soybeans',       true,  true),
        (9,  'SESAME',     'Sesame',         true,  true),
        (10, 'COCONUT',    'Coconut',        false, true),
        (11, 'CORN',       'Corn',           false, true),
        (12, 'GELATIN',    'Gelatin',        false, true),
        (13, 'SULFITES',   'Sulfites',       false, true)
      ON CONFLICT (allergen_id) DO NOTHING;
    `);

    // ── lkp_lab_test_categories ────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_lab_test_categories
        (test_category_id, code, name, applies_to_product_types, is_mandatory, is_active)
      VALUES
        (1,  'POTENCY',         'Potency / Cannabinoid Profile', '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","TOPICAL","CAPSULE","BEVERAGE"]', true,  true),
        (2,  'PESTICIDES',      'Pesticide Screening',           '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","CAPSULE","BEVERAGE"]',          true,  true),
        (3,  'HEAVY_METALS',    'Heavy Metals',                  '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","TOPICAL","CAPSULE","BEVERAGE"]', true,  true),
        (4,  'RESIDUAL_SOLVENTS','Residual Solvents',            '["VAPE","CONCENTRATE","TINCTURE","CAPSULE"]',                                                   true,  true),
        (5,  'MICROBIALS',      'Microbial Contaminants',        '["FLOWER","PRE_ROLL","EDIBLE","TINCTURE","CAPSULE","BEVERAGE"]',                                true,  true),
        (6,  'MYCOTOXINS',      'Mycotoxins',                    '["FLOWER","PRE_ROLL","EDIBLE"]',                                                                true,  true),
        (7,  'MOISTURE',        'Moisture Content',              '["FLOWER","PRE_ROLL"]',                                                                          true,  true),
        (8,  'TERPENES',        'Terpene Profile',               '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE"]',                                                    false, true),
        (9,  'FOREIGN_MATTER',  'Foreign Matter',                '["FLOWER","PRE_ROLL"]',                                                                          true,  true),
        (10, 'WATER_ACTIVITY',  'Water Activity',                '["EDIBLE","BEVERAGE"]',                                                                          true,  true)
      ON CONFLICT (test_category_id) DO NOTHING;
    `);

    // ── lkp_tax_categories (NY / NJ / CT) ─────────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_tax_categories
        (tax_category_id, code, state, name, tax_basis, rate, effective_date, statutory_reference, is_active)
      VALUES
        -- New York (Cannabis Law § 130)
        (1,  'NY_THC_FLOWER',      'NY', 'NY Flower THC Excise (per mg THC)',       'per_mg_thc',   0.005,  '2023-01-01', 'NY Cannabis Law § 130(1)(a)',  true),
        (2,  'NY_THC_CONCENTRATE', 'NY', 'NY Concentrate THC Excise (per mg THC)',  'per_mg_thc',   0.025,  '2023-01-01', 'NY Cannabis Law § 130(1)(b)',  true),
        (3,  'NY_THC_EDIBLE',      'NY', 'NY Edible THC Excise (per mg THC)',       'per_mg_thc',   0.030,  '2023-01-01', 'NY Cannabis Law § 130(1)(c)',  true),
        (4,  'NY_RETAIL_EXCISE',   'NY', 'NY Retail Cannabis Excise (9%)',          'retail_price', 0.09,   '2023-01-01', 'NY Cannabis Law § 130(2)',     true),
        -- New Jersey (CREAMMA — N.J.S.A. 24:6I-1)
        (5,  'NJ_SOCIAL_EQUITY',   'NJ', 'NJ Social Equity Excise Fee',             'wholesale_price',0.01, '2022-04-21', 'N.J.S.A. 24:6I-56',           true),
        (6,  'NJ_SALES_TAX',       'NJ', 'NJ Cannabis Sales Tax (6.625%)',          'retail_price', 0.06625,'2022-04-21', 'N.J.S.A. 54:32B-1',           true),
        (7,  'NJ_MUNICIPAL',       'NJ', 'NJ Municipal Cannabis Tax (up to 2%)',    'retail_price', 0.02,   '2022-04-21', 'N.J.S.A. 24:6I-45',           true),
        -- Connecticut (PA 21-1)
        (8,  'CT_EXCISE_CANNABIS', 'CT', 'CT Cannabis Excise Tax (3% per mg THC)',  'per_mg_thc',   0.03,   '2021-07-01', 'Conn. Gen. Stat. § 12-330aa', true),
        (9,  'CT_SALES_TAX',       'CT', 'CT Sales Tax (6.35%)',                    'retail_price', 0.0635, '2021-07-01', 'Conn. Gen. Stat. § 12-408',   true),
        (10, 'CT_MUNICIPAL',       'CT', 'CT Municipal Cannabis Tax (up to 3%)',    'retail_price', 0.03,   '2021-07-01', 'Conn. Gen. Stat. § 12-330bb', true)
      ON CONFLICT (tax_category_id) DO NOTHING;
    `);

    // ── lkp_metrc_item_categories (NY / NJ / CT) ───────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_metrc_item_categories
        (metrc_category_id, code, state, name, product_type_code, requires_unit_weight, effective_date, is_active)
      VALUES
        -- New York (OCM Metrc)
        (1,  'NY_FLOWER',           'NY', 'Flower',                        'FLOWER',      true,  '2023-01-01', true),
        (2,  'NY_PREROLL_FLOWER',   'NY', 'Pre-Roll Flower',               'PRE_ROLL',    true,  '2023-01-01', true),
        (3,  'NY_PREROLL_INFUSED',  'NY', 'Pre-Roll Infused',              'PRE_ROLL',    true,  '2023-01-01', true),
        (4,  'NY_VAPE',             'NY', 'Vape Product',                  'VAPE',        true,  '2023-01-01', true),
        (5,  'NY_CONCENTRATE',      'NY', 'Concentrate',                   'CONCENTRATE', true,  '2023-01-01', true),
        (6,  'NY_EDIBLE_SOLID',     'NY', 'Edible (Solid)',                'EDIBLE',      false, '2023-01-01', true),
        (7,  'NY_EDIBLE_LIQUID',    'NY', 'Edible (Liquid)',               'BEVERAGE',    false, '2023-01-01', true),
        (8,  'NY_TINCTURE',         'NY', 'Tincture',                      'TINCTURE',    false, '2023-01-01', true),
        (9,  'NY_TOPICAL',          'NY', 'Topical',                       'TOPICAL',     false, '2023-01-01', true),
        (10, 'NY_CAPSULE',          'NY', 'Capsule',                       'CAPSULE',     false, '2023-01-01', true),
        -- New Jersey (CRC Metrc)
        (11, 'NJ_FLOWER',           'NJ', 'Flower',                        'FLOWER',      true,  '2022-04-21', true),
        (12, 'NJ_PREROLL',          'NJ', 'Pre-Roll Flower',               'PRE_ROLL',    true,  '2022-04-21', true),
        (13, 'NJ_VAPE',             'NJ', 'Vape Product',                  'VAPE',        true,  '2022-04-21', true),
        (14, 'NJ_CONCENTRATE',      'NJ', 'Concentrate',                   'CONCENTRATE', true,  '2022-04-21', true),
        (15, 'NJ_EDIBLE_SOLID',     'NJ', 'Edible (Solid)',                'EDIBLE',      false, '2022-04-21', true),
        (16, 'NJ_EDIBLE_LIQUID',    'NJ', 'Edible (Liquid)',               'BEVERAGE',    false, '2022-04-21', true),
        (17, 'NJ_TINCTURE',         'NJ', 'Tincture',                      'TINCTURE',    false, '2022-04-21', true),
        (18, 'NJ_TOPICAL',          'NJ', 'Topical',                       'TOPICAL',     false, '2022-04-21', true),
        (19, 'NJ_CAPSULE',          'NJ', 'Capsule',                       'CAPSULE',     false, '2022-04-21', true),
        -- Connecticut (DCP Metrc)
        (20, 'CT_FLOWER',           'CT', 'Flower',                        'FLOWER',      true,  '2023-01-10', true),
        (21, 'CT_PREROLL',          'CT', 'Pre-Roll Flower',               'PRE_ROLL',    true,  '2023-01-10', true),
        (22, 'CT_VAPE',             'CT', 'Vape Product',                  'VAPE',        true,  '2023-01-10', true),
        (23, 'CT_CONCENTRATE',      'CT', 'Concentrate',                   'CONCENTRATE', true,  '2023-01-10', true),
        (24, 'CT_EDIBLE_SOLID',     'CT', 'Edible (Solid)',                'EDIBLE',      false, '2023-01-10', true),
        (25, 'CT_EDIBLE_LIQUID',    'CT', 'Edible (Liquid)',               'BEVERAGE',    false, '2023-01-10', true),
        (26, 'CT_TINCTURE',         'CT', 'Tincture',                      'TINCTURE',    false, '2023-01-10', true),
        (27, 'CT_TOPICAL',          'CT', 'Topical',                       'TOPICAL',     false, '2023-01-10', true),
        (28, 'CT_CAPSULE',          'CT', 'Capsule',                       'CAPSULE',     false, '2023-01-10', true)
      ON CONFLICT (metrc_category_id) DO NOTHING;
    `);

    // ── lkp_metrc_adjustment_reasons (NY / NJ / CT) ────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_metrc_adjustment_reasons
        (adjustment_reason_id, code, state, name, reason_category, is_active)
      VALUES
        -- Universal / shared across states
        (1,  'THEFT',              'ALL', 'Theft',                          'loss',        true),
        (2,  'LOST',               'ALL', 'Lost',                           'loss',        true),
        (3,  'DESTROYED',          'ALL', 'Destroyed',                      'loss',        true),
        (4,  'RECALL',             'ALL', 'Product Recall',                 'compliance',  true),
        (5,  'QA_FAIL',            'ALL', 'Failed QA / Lab Test',           'compliance',  true),
        (6,  'DAMAGED',            'ALL', 'Damaged',                        'loss',        true),
        (7,  'RETURNED_SUPPLIER',  'ALL', 'Returned to Supplier',           'transfer',    true),
        (8,  'COUNT_ADJ',          'ALL', 'Physical Count Adjustment',      'inventory',   true),
        (9,  'SAMPLE_LAB',         'ALL', 'Lab Sample',                     'sample',      true),
        (10, 'SAMPLE_COMP',        'ALL', 'Compliance Sample',              'sample',      true),
        (11, 'SAMPLE_INTERNAL',    'ALL', 'Internal QA Sample',             'sample',      true),
        (12, 'DONATED',            'ALL', 'Donated',                        'transfer',    true),
        (13, 'SOLD',               'ALL', 'Sold (POS Adjustment)',          'sale',        true),
        (14, 'MOISTURE_LOSS',      'ALL', 'Moisture / Drying Loss',         'processing',  true),
        (15, 'TRIM_WASTE',         'ALL', 'Trim / Processing Waste',        'processing',  true),
        -- New York specific (OCM)
        (16, 'NY_MOLD',            'NY',  'Mold / Contamination (NY)',      'compliance',  true),
        (17, 'NY_PESTICIDE_FAIL',  'NY',  'Failed Pesticide Test (NY)',     'compliance',  true),
        (18, 'NY_DISPOSAL_OCM',    'NY',  'OCM Mandated Disposal',          'compliance',  true),
        -- New Jersey specific (CRC)
        (19, 'NJ_SPILLAGE',        'NJ',  'Spillage / Leakage (NJ)',        'loss',        true),
        (20, 'NJ_CRC_DISPOSAL',    'NJ',  'CRC Mandated Disposal (NJ)',     'compliance',  true),
        -- Connecticut specific (DCP)
        (21, 'CT_EXPIRED',         'CT',  'Expired Product (CT)',           'compliance',  true),
        (22, 'CT_DCP_DISPOSAL',    'CT',  'DCP Mandated Disposal (CT)',     'compliance',  true)
      ON CONFLICT (adjustment_reason_id) DO NOTHING;
    `);

    // ── lkp_warning_statements (NY / NJ / CT) ─────────────────────────────
    await queryRunner.query(`
      INSERT INTO lkp_warning_statements
        (warning_id, code, jurisdiction, statement_text, applies_to_product_types,
         applies_to_license_type, is_mandatory, effective_date, statutory_reference, is_active)
      VALUES
        -- Universal / Federal
        (1,  'KEEP_OUT_OF_REACH',   'ALL',
         'KEEP OUT OF REACH OF CHILDREN AND PETS.',
         '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","TOPICAL","CAPSULE","BEVERAGE"]',
         null, true, '2021-01-01', null, true),

        (2,  'PREGNANCY_WARNING',   'ALL',
         'WARNING: Use of cannabis during pregnancy or breastfeeding may be harmful to your baby. Ask your doctor before using.',
         '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","CAPSULE","BEVERAGE"]',
         null, true, '2021-01-01', null, true),

        (3,  'DRIVING_WARNING',     'ALL',
         'WARNING: Do not drive or operate heavy machinery while under the influence of cannabis.',
         '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","CAPSULE","BEVERAGE"]',
         null, true, '2021-01-01', null, true),

        (4,  'NOT_FDA_APPROVED',    'ALL',
         'This product has not been analyzed or approved by the FDA. There is limited information on the side effects of using this product.',
         '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","TOPICAL","CAPSULE","BEVERAGE"]',
         null, true, '2021-01-01', null, true),

        (5,  'HEALTH_RISKS',        'ALL',
         'WARNING: Cannabis use can impair concentration, coordination and judgement. Do not operate a vehicle or machinery under its influence.',
         '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","CAPSULE","BEVERAGE"]',
         null, true, '2021-01-01', null, true),

        -- New York (OCM required)
        (6,  'NY_OCM_CANNABIS',     'NY',
         'This product was produced without regulatory oversight for health, safety, or efficacy.',
         '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","TOPICAL","CAPSULE","BEVERAGE"]',
         null, true, '2023-01-01', 'NY Cannabis Law § 128', true),

        (7,  'NY_EDIBLE_DELAY',     'NY',
         'WARNING: The intoxicating effects of this product may be delayed up to two hours.',
         '["EDIBLE","BEVERAGE","TINCTURE","CAPSULE"]',
         null, true, '2023-01-01', 'NY Cannabis Law § 128', true),

        (8,  'NY_THC_CONTENT',      'NY',
         'Contains THC. For adults 21 and older only. Keep out of reach of children.',
         '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","CAPSULE","BEVERAGE"]',
         null, true, '2023-01-01', 'NY Cannabis Law § 128', true),

        -- New Jersey (CRC required)
        (9,  'NJ_DRUG_TEST',        'NJ',
         'WARNING: Cannabis use may affect results of drug tests.',
         '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","CAPSULE","BEVERAGE"]',
         null, true, '2022-04-21', 'N.J.A.C. 17:30-11.3', true),

        (10, 'NJ_MENTAL_HEALTH',    'NJ',
         'WARNING: Cannabis use may worsen mental health conditions including anxiety, depression and psychosis.',
         '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","CAPSULE","BEVERAGE"]',
         null, true, '2022-04-21', 'N.J.A.C. 17:30-11.3', true),

        (11, 'NJ_EDIBLE_DELAY',     'NJ',
         'WARNING: Effects may be delayed up to 2 hours after consumption. Do not consume additional product before effects are felt.',
         '["EDIBLE","BEVERAGE","CAPSULE"]',
         null, true, '2022-04-21', 'N.J.A.C. 17:30-11.3', true),

        -- Connecticut (DCP required)
        (12, 'CT_YOUTH_BRAIN',      'CT',
         'WARNING: Cannabis use by those under age 21 may be detrimental to brain development.',
         '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","CAPSULE","BEVERAGE"]',
         null, true, '2021-07-01', 'Conn. Gen. Stat. § 21a-420p', true),

        (13, 'CT_ADDICTION',        'CT',
         'WARNING: Cannabis can be habit forming. Using cannabis regularly may result in cannabis use disorder.',
         '["FLOWER","PRE_ROLL","VAPE","CONCENTRATE","EDIBLE","TINCTURE","CAPSULE","BEVERAGE"]',
         null, true, '2021-07-01', 'Conn. Gen. Stat. § 21a-420p', true),

        (14, 'CT_EDIBLE_DELAY',     'CT',
         'WARNING: Start low and go slow. The effects of edibles and beverages can take 1-2 hours to be felt.',
         '["EDIBLE","BEVERAGE","CAPSULE"]',
         null, true, '2021-07-01', 'Conn. Gen. Stat. § 21a-420p', true)
      ON CONFLICT (warning_id) DO NOTHING;
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM lkp_warning_statements`);
    await queryRunner.query(`DELETE FROM lkp_metrc_adjustment_reasons`);
    await queryRunner.query(`DELETE FROM lkp_metrc_item_categories`);
    await queryRunner.query(`DELETE FROM lkp_tax_categories`);
    await queryRunner.query(`DELETE FROM lkp_lab_test_categories`);
    await queryRunner.query(`DELETE FROM lkp_allergens`);
    await queryRunner.query(`DELETE FROM lkp_cannabinoids`);
    await queryRunner.query(`DELETE FROM lkp_terpenes`);
    await queryRunner.query(`DELETE FROM lkp_flavors`);
    await queryRunner.query(`DELETE FROM lkp_effects`);
    await queryRunner.query(`DELETE FROM lkp_extraction_methods`);
    await queryRunner.query(`DELETE FROM lkp_packaging_types`);
    await queryRunner.query(`DELETE FROM lkp_unit_of_measure`);
    await queryRunner.query(`DELETE FROM lkp_product_categories`);
    await queryRunner.query(`DELETE FROM lkp_product_types`);
  }
}
MIGRATION

echo "✅ Migration created: $FILE"
echo ""
echo "Next: cd apps/api && pnpm migration:run"
