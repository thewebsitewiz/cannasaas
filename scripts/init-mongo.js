// Initialize MongoDB database
db = db.getSiblingDB('cannasaas_products');

// Create collections
db.createCollection('products');
db.createCollection('categories');
db.createCollection('brands');

// Create indexes
db.products.createIndex({ tenant_id: 1 });
db.products.createIndex({ sku: 1, tenant_id: 1 }, { unique: true });
db.products.createIndex({ name: 'text', description: 'text' });

db.categories.createIndex({ tenant_id: 1 });
db.brands.createIndex({ tenant_id: 1 });

// Insert sample data
db.products.insertOne({
  tenant_id: 'demo',
  sku: 'SAMPLE-001',
  name: 'Sample Product',
  description: 'This is a sample product',
  category: 'flower',
  price: 29.99,
  thc_percentage: 24.5,
  cbd_percentage: 0.8,
  created_at: new Date(),
  updated_at: new Date(),
});

print('MongoDB initialization complete!');