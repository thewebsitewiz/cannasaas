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