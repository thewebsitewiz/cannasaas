-- ============================================================
-- CannaSaas Full Seed Script
-- All passwords: admin123
-- Hash: $2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy
-- ============================================================

-- TRUNCATE all tables (respecting FK order)
TRUNCATE TABLE reviews, order_items, order_status_history, orders,
  compliance_logs, daily_sales_reports, stock_movements, product_images,
  product_variants, products, categories, cart_items, carts,
  loyalty_transactions, loyalty_accounts, marketing_logs, promotions,
  analytics_events, api_keys, audit_logs, beta_feedback, beta_invitations,
  feature_flags, deliveries, inventory_items, branding_configs,
  dispensaries, companies, users, organizations, tenants
  CASCADE;

-- ============================================================
-- TENANTS (1 per org)
-- ============================================================
INSERT INTO tenants (id, name, subdomain) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Green Valley Cannabis', 'greenvalley'),
  ('10000000-0000-0000-0000-000000000002', 'Pacific Leaf Holdings', 'pacificleaf'),
  ('10000000-0000-0000-0000-000000000003', 'Mountain High Group', 'mountainhigh'),
  ('10000000-0000-0000-0000-000000000004', 'Sunrise Dispensaries', 'sunrise');

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
INSERT INTO organizations (id, name, subdomain, legal_name, contact_email, slug, plan, subscription_status, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Green Valley Cannabis', 'greenvalley', 'Green Valley Cannabis LLC', 'admin@greenvalley.com', 'green-valley', 'professional', 'active', true),
  ('10000000-0000-0000-0000-000000000002', 'Pacific Leaf Holdings', 'pacificleaf', 'Pacific Leaf Holdings Inc', 'admin@pacificleaf.com', 'pacific-leaf', 'enterprise', 'active', true),
  ('10000000-0000-0000-0000-000000000003', 'Mountain High Group', 'mountainhigh', 'Mountain High Group LLC', 'admin@mountainhigh.com', 'mountain-high', 'professional', 'active', true),
  ('10000000-0000-0000-0000-000000000004', 'Sunrise Dispensaries', 'sunrise', 'Sunrise Dispensaries Corp', 'admin@sunrise.com', 'sunrise-dispensaries', 'starter', 'active', true);

-- ============================================================
-- COMPANIES
-- Org 1: 3 companies | Org 2: 4 companies | Org 3: 3 companies | Org 4: 3 companies
-- ============================================================
INSERT INTO companies (id, organization_id, name, slug, description) VALUES
  -- Green Valley (Org 1) - 3 companies
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'GV Retail Corp', 'gv-retail', 'Retail dispensary operations'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'GV Wellness Inc', 'gv-wellness', 'Medical cannabis wellness centers'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'GV Express', 'gv-express', 'Quick-serve cannabis retail'),
  -- Pacific Leaf (Org 2) - 4 companies
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'PL Northern Division', 'pl-north', 'Northern California operations'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'PL Southern Division', 'pl-south', 'Southern California operations'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'PL Oregon', 'pl-oregon', 'Oregon state operations'),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'PL Nevada', 'pl-nevada', 'Nevada state operations'),
  -- Mountain High (Org 3) - 3 companies
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'MH Denver Metro', 'mh-denver', 'Denver metro area stores'),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 'MH Mountain Towns', 'mh-mountain', 'Mountain resort town locations'),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 'MH Boulder County', 'mh-boulder', 'Boulder area operations'),
  -- Sunrise (Org 4) - 3 companies
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 'Sunrise East', 'sunrise-east', 'East side locations'),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', 'Sunrise West', 'sunrise-west', 'West side locations'),
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000004', 'Sunrise Central', 'sunrise-central', 'Downtown locations');

-- ============================================================
-- DISPENSARIES
-- ============================================================
INSERT INTO dispensaries (id, company_id, name, slug, street_address, city, state, zip_code, latitude, longitude, phone_number, email) VALUES
  -- GV Retail (Company 1) - 3 dispensaries
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Green Valley Downtown', 'gv-downtown', '420 Main St', 'San Francisco', 'CA', '94102', 37.7749295, -122.4194155, '415-555-0101', 'downtown@greenvalley.com'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Green Valley Marina', 'gv-marina', '123 Marina Blvd', 'San Francisco', 'CA', '94123', 37.8010900, -122.4368800, '415-555-0102', 'marina@greenvalley.com'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Green Valley Mission', 'gv-mission', '789 Valencia St', 'San Francisco', 'CA', '94110', 37.7599300, -122.4212900, '415-555-0103', 'mission@greenvalley.com'),
  -- GV Wellness (Company 2) - 3 dispensaries
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'GV Wellness Nob Hill', 'gvw-nobhill', '500 California St', 'San Francisco', 'CA', '94104', 37.7922400, -122.4058500, '415-555-0201', 'nobhill@gvwellness.com'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'GV Wellness SOMA', 'gvw-soma', '200 Folsom St', 'San Francisco', 'CA', '94105', 37.7907800, -122.3912900, '415-555-0202', 'soma@gvwellness.com'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', 'GV Wellness Sunset', 'gvw-sunset', '1500 Irving St', 'San Francisco', 'CA', '94122', 37.7637800, -122.4726000, '415-555-0203', 'sunset@gvwellness.com'),
  -- GV Express (Company 3) - 3 dispensaries
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', 'GV Express FiDi', 'gve-fidi', '100 Montgomery St', 'San Francisco', 'CA', '94104', 37.7891800, -122.4020200, '415-555-0301', 'fidi@gvexpress.com'),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003', 'GV Express Castro', 'gve-castro', '444 Castro St', 'San Francisco', 'CA', '94114', 37.7619400, -122.4350300, '415-555-0302', 'castro@gvexpress.com'),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000003', 'GV Express Haight', 'gve-haight', '710 Haight St', 'San Francisco', 'CA', '94117', 37.7711800, -122.4370400, '415-555-0303', 'haight@gvexpress.com'),
  -- PL Northern (Company 4) - 4 dispensaries
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000004', 'Pacific Leaf Sacramento', 'pl-sacramento', '1000 K St', 'Sacramento', 'CA', '95814', 38.5816000, -121.4944000, '916-555-0101', 'sacramento@pacificleaf.com'),
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000004', 'Pacific Leaf Oakland', 'pl-oakland', '500 Broadway', 'Oakland', 'CA', '94607', 37.8044000, -122.2712000, '510-555-0102', 'oakland@pacificleaf.com'),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000004', 'Pacific Leaf San Jose', 'pl-sanjose', '300 Santa Clara St', 'San Jose', 'CA', '95113', 37.3382000, -121.8863000, '408-555-0103', 'sanjose@pacificleaf.com'),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000004', 'Pacific Leaf Fresno', 'pl-fresno', '800 Fulton Mall', 'Fresno', 'CA', '93721', 36.7378000, -119.7871000, '559-555-0104', 'fresno@pacificleaf.com'),
  -- PL Southern (Company 5) - 5 dispensaries
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000005', 'Pacific Leaf Hollywood', 'pl-hollywood', '6800 Hollywood Blvd', 'Los Angeles', 'CA', '90028', 34.1016000, -118.3267000, '323-555-0201', 'hollywood@pacificleaf.com'),
  ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000005', 'Pacific Leaf Venice', 'pl-venice', '100 Windward Ave', 'Venice', 'CA', '90291', 33.9900000, -118.4726000, '310-555-0202', 'venice@pacificleaf.com'),
  ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000005', 'Pacific Leaf Santa Monica', 'pl-santamonica', '300 Santa Monica Blvd', 'Santa Monica', 'CA', '90401', 34.0195000, -118.4912000, '310-555-0203', 'santamonica@pacificleaf.com'),
  ('30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000005', 'Pacific Leaf DTLA', 'pl-dtla', '700 S Grand Ave', 'Los Angeles', 'CA', '90017', 34.0488000, -118.2600000, '213-555-0204', 'dtla@pacificleaf.com'),
  ('30000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000005', 'Pacific Leaf Long Beach', 'pl-longbeach', '200 Pine Ave', 'Long Beach', 'CA', '90802', 33.7701000, -118.1937000, '562-555-0205', 'longbeach@pacificleaf.com'),
  -- PL Oregon (Company 6) - 3 dispensaries
  ('30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000006', 'Pacific Leaf Portland', 'pl-portland', '100 SW Morrison St', 'Portland', 'OR', '97204', 45.5152000, -122.6784000, '503-555-0301', 'portland@pacificleaf.com'),
  ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000006', 'Pacific Leaf Eugene', 'pl-eugene', '500 Willamette St', 'Eugene', 'OR', '97401', 44.0521000, -123.0868000, '541-555-0302', 'eugene@pacificleaf.com'),
  ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000006', 'Pacific Leaf Bend', 'pl-bend', '900 NW Wall St', 'Bend', 'OR', '97703', 44.0582000, -121.3153000, '541-555-0303', 'bend@pacificleaf.com'),
  -- PL Nevada (Company 7) - 3 dispensaries
  ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000007', 'Pacific Leaf Strip', 'pl-strip', '3500 Las Vegas Blvd', 'Las Vegas', 'NV', '89109', 36.1270000, -115.1703000, '702-555-0401', 'strip@pacificleaf.com'),
  ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000007', 'Pacific Leaf Henderson', 'pl-henderson', '100 Water St', 'Henderson', 'NV', '89015', 36.0397000, -114.9819000, '702-555-0402', 'henderson@pacificleaf.com'),
  ('30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000007', 'Pacific Leaf Reno', 'pl-reno', '200 N Virginia St', 'Reno', 'NV', '89501', 39.5296000, -119.8138000, '775-555-0403', 'reno@pacificleaf.com'),
  -- MH Denver Metro (Company 8) - 4 dispensaries
  ('30000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000008', 'Mountain High LoDo', 'mh-lodo', '1600 Wazee St', 'Denver', 'CO', '80202', 39.7530000, -105.0000000, '303-555-0101', 'lodo@mountainhigh.com'),
  ('30000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000008', 'Mountain High RiNo', 'mh-rino', '2800 Larimer St', 'Denver', 'CO', '80205', 39.7621000, -104.9811000, '303-555-0102', 'rino@mountainhigh.com'),
  ('30000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000008', 'Mountain High Capitol Hill', 'mh-caphill', '1200 E Colfax Ave', 'Denver', 'CO', '80218', 39.7400000, -104.9742000, '303-555-0103', 'caphill@mountainhigh.com'),
  ('30000000-0000-0000-0000-000000000028', '20000000-0000-0000-0000-000000000008', 'Mountain High Aurora', 'mh-aurora', '600 Havana St', 'Aurora', 'CO', '80010', 39.7294000, -104.8657000, '303-555-0104', 'aurora@mountainhigh.com'),
  -- MH Mountain Towns (Company 9) - 3 dispensaries
  ('30000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000009', 'Mountain High Vail', 'mh-vail', '100 E Meadow Dr', 'Vail', 'CO', '81657', 39.6403000, -106.3742000, '970-555-0201', 'vail@mountainhigh.com'),
  ('30000000-0000-0000-0000-000000000030', '20000000-0000-0000-0000-000000000009', 'Mountain High Aspen', 'mh-aspen', '300 S Mill St', 'Aspen', 'CO', '81611', 39.1911000, -106.8175000, '970-555-0202', 'aspen@mountainhigh.com'),
  ('30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000009', 'Mountain High Breckenridge', 'mh-breck', '200 S Main St', 'Breckenridge', 'CO', '80424', 39.4817000, -106.0384000, '970-555-0203', 'breck@mountainhigh.com'),
  -- MH Boulder (Company 10) - 3 dispensaries
  ('30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000010', 'Mountain High Pearl St', 'mh-pearl', '1400 Pearl St', 'Boulder', 'CO', '80302', 40.0176000, -105.2797000, '303-555-0301', 'pearl@mountainhigh.com'),
  ('30000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000010', 'Mountain High University', 'mh-university', '1100 University Ave', 'Boulder', 'CO', '80302', 40.0086000, -105.2680000, '303-555-0302', 'university@mountainhigh.com'),
  ('30000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000010', 'Mountain High Longmont', 'mh-longmont', '400 Main St', 'Longmont', 'CO', '80501', 40.1672000, -105.1019000, '303-555-0303', 'longmont@mountainhigh.com'),
  -- Sunrise East (Company 11) - 3 dispensaries
  ('30000000-0000-0000-0000-000000000035', '20000000-0000-0000-0000-000000000011', 'Sunrise Scottsdale', 'sr-scottsdale', '7000 E Camelback Rd', 'Scottsdale', 'AZ', '85251', 33.5092000, -111.9280000, '480-555-0101', 'scottsdale@sunrise.com'),
  ('30000000-0000-0000-0000-000000000036', '20000000-0000-0000-0000-000000000011', 'Sunrise Tempe', 'sr-tempe', '500 S Mill Ave', 'Tempe', 'AZ', '85281', 33.4255000, -111.9400000, '480-555-0102', 'tempe@sunrise.com'),
  ('30000000-0000-0000-0000-000000000037', '20000000-0000-0000-0000-000000000011', 'Sunrise Mesa', 'sr-mesa', '200 W Main St', 'Mesa', 'AZ', '85201', 33.4152000, -111.8315000, '480-555-0103', 'mesa@sunrise.com'),
  -- Sunrise West (Company 12) - 3 dispensaries
  ('30000000-0000-0000-0000-000000000038', '20000000-0000-0000-0000-000000000012', 'Sunrise Glendale', 'sr-glendale', '5800 W Glenn Dr', 'Glendale', 'AZ', '85301', 33.5387000, -112.1860000, '623-555-0201', 'glendale@sunrise.com'),
  ('30000000-0000-0000-0000-000000000039', '20000000-0000-0000-0000-000000000012', 'Sunrise Peoria', 'sr-peoria', '8300 W Thunderbird Rd', 'Peoria', 'AZ', '85381', 33.6115000, -112.2374000, '623-555-0202', 'peoria@sunrise.com'),
  ('30000000-0000-0000-0000-000000000040', '20000000-0000-0000-0000-000000000012', 'Sunrise Surprise', 'sr-surprise', '14000 W Grand Ave', 'Surprise', 'AZ', '85374', 33.6292000, -112.3680000, '623-555-0203', 'surprise@sunrise.com'),
  -- Sunrise Central (Company 13) - 3 dispensaries
  ('30000000-0000-0000-0000-000000000041', '20000000-0000-0000-0000-000000000013', 'Sunrise Downtown Phoenix', 'sr-dtphx', '100 W Washington St', 'Phoenix', 'AZ', '85003', 33.4484000, -112.0740000, '602-555-0301', 'dtphx@sunrise.com'),
  ('30000000-0000-0000-0000-000000000042', '20000000-0000-0000-0000-000000000013', 'Sunrise Midtown', 'sr-midtown', '3000 N Central Ave', 'Phoenix', 'AZ', '85012', 33.4842000, -112.0740000, '602-555-0302', 'midtown@sunrise.com'),
  ('30000000-0000-0000-0000-000000000043', '20000000-0000-0000-0000-000000000013', 'Sunrise Arcadia', 'sr-arcadia', '4000 E Indian School Rd', 'Phoenix', 'AZ', '85018', 33.4942000, -111.9876000, '602-555-0303', 'arcadia@sunrise.com');

-- ============================================================
-- USERS
-- All passwords: admin123
-- bcrypt hash: $2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy
-- ============================================================

-- Org-level admins (super_admin / owner)
INSERT INTO users (id, organization_id, tenant_id, email, email_verified, first_name, last_name, password_hash, role, is_active, age_verified, failed_login_attempts, two_factor_enabled, phone_verified, addresses, preferences, loyalty) VALUES
  -- Green Valley Org Admins (2)
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'sarah.chen@greenvalley.com', true, 'Sarah', 'Chen', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'super_admin', true, true, 0, false, false, '[]', '{}', '{}'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'marcus.jones@greenvalley.com', true, 'Marcus', 'Jones', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'owner', true, true, 0, false, false, '[]', '{}', '{}'),
  -- Pacific Leaf Org Admins (2)
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'jessica.park@pacificleaf.com', true, 'Jessica', 'Park', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'super_admin', true, true, 0, false, false, '[]', '{}', '{}'),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'david.kim@pacificleaf.com', true, 'David', 'Kim', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'owner', true, true, 0, false, false, '[]', '{}', '{}'),
  -- Mountain High Org Admins (1)
  ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'mike.colorado@mountainhigh.com', true, 'Mike', 'Colorado', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'super_admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- Sunrise Org Admins (2)
  ('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'elena.garcia@sunrise.com', true, 'Elena', 'Garcia', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'super_admin', true, true, 0, false, false, '[]', '{}', '{}'),
  ('40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'carlos.reyes@sunrise.com', true, 'Carlos', 'Reyes', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'owner', true, true, 0, false, false, '[]', '{}', '{}');

-- Company-level admins (admin role)
INSERT INTO users (id, organization_id, tenant_id, email, email_verified, first_name, last_name, password_hash, role, is_active, age_verified, failed_login_attempts, two_factor_enabled, phone_verified, addresses, preferences, loyalty) VALUES
  -- GV Retail (Company 1) - 2 admins
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'admin1@gv-retail.com', true, 'Tom', 'Baker', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'admin2@gv-retail.com', true, 'Lisa', 'Wong', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- GV Wellness (Company 2) - 1 admin
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'admin@gv-wellness.com', true, 'Rachel', 'Green', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- GV Express (Company 3) - 1 admin
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'admin@gv-express.com', true, 'Kevin', 'Hart', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- PL Northern (Company 4) - 2 admins
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'admin1@pl-north.com', true, 'Amy', 'Nguyen', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  ('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'admin2@pl-north.com', true, 'Brian', 'Davis', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- PL Southern (Company 5) - 2 admins
  ('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'admin1@pl-south.com', true, 'Maria', 'Lopez', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  ('50000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'admin2@pl-south.com', true, 'James', 'Wilson', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- PL Oregon (Company 6) - 1 admin
  ('50000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'admin@pl-oregon.com', true, 'Chris', 'Portland', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- PL Nevada (Company 7) - 1 admin
  ('50000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'admin@pl-nevada.com', true, 'Tony', 'Vegas', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- MH Denver Metro (Company 8) - 2 admins
  ('50000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'admin1@mh-denver.com', true, 'Jake', 'Summit', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  ('50000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'admin2@mh-denver.com', true, 'Nina', 'Peak', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- MH Mountain Towns (Company 9) - 1 admin
  ('50000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'admin@mh-mountain.com', true, 'Zach', 'Alpine', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- MH Boulder (Company 10) - 1 admin
  ('50000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'admin@mh-boulder.com', true, 'Sophie', 'Flatiron', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- Sunrise East (Company 11) - 1 admin
  ('50000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'admin@sunrise-east.com', true, 'Rosa', 'Flores', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- Sunrise West (Company 12) - 2 admins
  ('50000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'admin1@sunrise-west.com', true, 'Diego', 'Rivera', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  ('50000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'admin2@sunrise-west.com', true, 'Ana', 'Martinez', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}'),
  -- Sunrise Central (Company 13) - 1 admin
  ('50000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'admin@sunrise-central.com', true, 'Luis', 'Ramirez', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'admin', true, true, 0, false, false, '[]', '{}', '{}');

-- Dispensary-level staff (manager / budtender)
-- Adding 3-5 per dispensary for the first few dispensaries of each org, then fewer for the rest
INSERT INTO users (id, organization_id, tenant_id, email, email_verified, first_name, last_name, password_hash, role, is_active, age_verified, failed_login_attempts, two_factor_enabled, phone_verified, addresses, preferences, loyalty) VALUES
  -- GV Downtown (Disp 1) - 4 staff
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'mgr1@gv-downtown.com', true, 'Alex', 'Rivera', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'manager', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'bud1@gv-downtown.com', true, 'Jamie', 'Lee', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'bud2@gv-downtown.com', true, 'Sam', 'Patel', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'bud3@gv-downtown.com', true, 'Taylor', 'Swift', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  -- GV Marina (Disp 2) - 3 staff
  ('60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'mgr@gv-marina.com', true, 'Pat', 'Ocean', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'manager', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'bud1@gv-marina.com', true, 'Casey', 'Shore', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'bud2@gv-marina.com', true, 'Drew', 'Bay', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  -- PL Hollywood (Disp 14) - 5 staff
  ('60000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'mgr1@pl-hollywood.com', true, 'Jordan', 'Star', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'manager', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'mgr2@pl-hollywood.com', true, 'Morgan', 'Blvd', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'manager', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'bud1@pl-hollywood.com', true, 'Avery', 'Vine', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'bud2@pl-hollywood.com', true, 'Riley', 'Sunset', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'bud3@pl-hollywood.com', true, 'Quinn', 'Palm', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  -- MH LoDo (Disp 25) - 4 staff
  ('60000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'mgr@mh-lodo.com', true, 'Harper', 'Mile', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'manager', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'bud1@mh-lodo.com', true, 'Skyler', 'Peak', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'bud2@mh-lodo.com', true, 'Rowan', 'Snow', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'bud3@mh-lodo.com', true, 'Blake', 'Ridge', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  -- Sunrise Scottsdale (Disp 35) - 3 staff
  ('60000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'mgr@sr-scottsdale.com', true, 'Phoenix', 'Sol', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'manager', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'bud1@sr-scottsdale.com', true, 'Sage', 'Desert', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}'),
  ('60000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'bud2@sr-scottsdale.com', true, 'Ember', 'Cactus', '$2b$12$lYNXEkNEBGAxZZxyNArmKOL/EUTgxiwAxITXigM/fsO/im4P.tMMy', 'budtender', true, true, 0, false, false, '[]', '{}', '{}');

-- ============================================================
-- SUMMARY QUERY (run after seeding to verify)
-- ============================================================
-- SELECT 'Tenants' AS entity, COUNT(*) FROM tenants
-- UNION ALL SELECT 'Organizations', COUNT(*) FROM organizations
-- UNION ALL SELECT 'Companies', COUNT(*) FROM companies
-- UNION ALL SELECT 'Dispensaries', COUNT(*) FROM dispensaries
-- UNION ALL SELECT 'Users', COUNT(*) FROM users;
