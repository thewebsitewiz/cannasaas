// Server Component — data fetched on the server with ISR
import ProductFilters from './ProductFilters';

const DEFAULT_DISPENSARY_ID = process.env['NEXT_PUBLIC_DISPENSARY_ID'] || '45cd244d-7016-4db8-8e88-9c71725340c8';
const API_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000';

async function getProducts(dispensaryId: string) {
  try {
    const res = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($dispensaryId: ID!) {
          products(dispensaryId: $dispensaryId, limit: 50) {
            id name description strainType strainName
            thcPercent cbdPercent effects flavors
            variants { variantId name retailPrice }
          }
        }`,
        variables: { dispensaryId },
      }),
      next: { revalidate: 60 },
    });
    const json = await res.json();
    return json?.data?.products || [];
  } catch (err) {
    console.error('Failed to fetch products:', err);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts(DEFAULT_DISPENSARY_ID);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pt-24">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-wider uppercase text-emerald-600 mb-2">Our Selection</p>
        <h1 className="text-3xl sm:text-4xl font-light text-gray-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Browse the <span className="italic">Menu</span>
        </h1>
      </div>
      <ProductFilters products={products} />
    </div>
  );
}
