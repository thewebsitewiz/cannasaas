import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useProducts,
  useDeleteProduct,
  type ProductFilters,
} from "@cannasaas/api-client";

export default function ProductList() {
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 25,
  });
  const { data, isLoading } = useProducts(filters);
  const deleteProduct = useDeleteProduct();

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          to="/products/new"
          className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
        >
          + New Product
        </Link>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search products..."
        className="w-full max-w-md rounded border px-3 py-2"
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
        }
      />

      {isLoading && <p className="text-gray-500">Loading...</p>}

      {data && (
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Category</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Stock</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  <Link
                    to={`/products/${p.id}`}
                    className="text-green-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="py-2 capitalize">
                  {p.category.replace("_", " ")}
                </td>
                <td className="py-2 text-right">${p.price.toFixed(2)}</td>
                <td className="py-2 text-right">{p.quantity}</td>
                <td className="py-2 text-right">
                  <Link
                    to={`/products/${p.id}/edit`}
                    className="mr-2 text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
