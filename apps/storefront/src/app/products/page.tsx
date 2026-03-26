import ProductFilters from './ProductFilters';

const DEFAULT_DISPENSARY_ID = process.env['NEXT_PUBLIC_DISPENSARY_ID'] || 'c0000000-0000-0000-0000-000000000001';
const API_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000';

async function getProducts(dispensaryId: string) {
  try {
    const res = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($dispensaryId: ID!) {
          products(dispensaryId: $dispensaryId, limit: 50) {
            id name description strainType
            thcPercent cbdPercent
            variants { variantId name retailPrice stockQuantity stockStatus }
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
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-wider uppercase text-brand-600 mb-2">Our Selection</p>
        <h1 className="text-3xl sm:text-4xl font-display text-txt">
          Browse the <span className="italic">Menu</span>
        </h1>
      </div>
      <ProductFilters products={products} />
    </div>
  );
}
