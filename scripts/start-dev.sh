echo "Starting infrastructure..."
docker compose up -d postgres redis

echo "Waiting for PostgreSQL..."
until docker exec cannasaas-postgres pg_isready -U cannasaas -q; do
  sleep 1
done
echo "PostgreSQL ready."

echo "Waiting for Redis..."
until docker exec cannasaas-redis redis-cli ping | grep -q PONG; do
  sleep 1
done
echo "Redis ready."

echo ""
echo "Infrastructure is up. Start applications in separate terminals:"
echo ""
echo "  API:        cd cannasaas-api && npm run start:dev"
echo "  Admin:      cd cannasaas-admin && npm run dev"
echo "  Storefront: cd cannasaas-storefront && npm run dev"
echo ""
echo "Endpoints:"
echo "  API:        http://localhost:3000/api/v1"
echo "  Swagger:    http://localhost:3000/api/docs"
echo "  Admin:      http://localhost:5173"
echo "  Storefront: http://localhost:3001"```````````````````