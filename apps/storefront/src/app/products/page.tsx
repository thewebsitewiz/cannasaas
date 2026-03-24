// Server Component — data fetched on the server with ISR
import ProductFilters from './ProductFilters';

const DEFAULT_DISPENSARY_ID = process.env['NEXT_PUBLIC_DISPENSARY_ID'] || 'c0000000-0000-0000-0000-000000000001';

async function getProducts(dispensaryId: string) {
  const res = await fetch(`${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query($dispensaryId: ID!) {
        products(dispensaryId: $dispensaryId) {
          id name description strainType thcPercent cbdPercent imageUrl
          variants { variantId name sku weightGrams }
          pricing { variantId priceType price }
        }
      }`,
      variables: { dispensaryId },
    }),
    next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  });
  const { data } = await res.json();
  return data?.products || [];
}

export default async function ProductsPage() {
  const products = await getProducts(DEFAULT_DISPENSARY_ID);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Our Menu</h1>
      <ProductFilters products={products} />
    </div>
  );
}
