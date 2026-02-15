 cat cannasaas-seed.sql | docker exec -i cannasaas-postgres psql -U postgres -d cannasaas

docker exec cannasaas-postgres psql -U postgres -d cannasaas -c "
SELECT u.email, 'admin123' as password, u.role, o.name as organization,
  CASE u.role
    WHEN 'super_admin' THEN 'Org Admin'
    WHEN 'owner' THEN 'Org Owner'
    WHEN 'admin' THEN 'Company Admin'
    WHEN 'manager' THEN 'Dispensary Manager'
    WHEN 'budtender' THEN 'Dispensary Staff'
    ELSE 'Other'
  END AS level
FROM users u JOIN organizations o ON u.organization_id = o.id"


docker exec cannasaas-postgres psql -U postgres -d cannasaas -c "
INSERT INTO categories (id, name, slug, dispensary_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Flower', 'flower', '30000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 'Edibles', 'edibles', '30000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 'Concentrates', 'concentrates', '30000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 'Pre-Rolls', 'pre-rolls', '30000000-0000-0000-0000-000000000001', NOW(), NOW());
"
            