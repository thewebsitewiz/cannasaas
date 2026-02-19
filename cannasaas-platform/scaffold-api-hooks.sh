Z#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scaffold-api-hooks.sh
# Scaffolds storefront + admin component files with @cannasaas/api-client hooks
#
# Usage:
#   cd ~/Documents/Projects/cannasaas/cannasaas-platform
#   bash scaffold-api-hooks.sh
#
# ⚠️  SAFE: Only writes files that DON'T already exist (uses write_if_new).
#    Existing files are SKIPPED with a notice.
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

ROOT="$(pwd)"

write_if_new() {
  local filepath="$1"
  local content="$2"
  local dir
  dir="$(dirname "$filepath")"

  mkdir -p "$dir"

  if [[ -f "$filepath" ]]; then
    echo "  ⏭️  SKIP (exists): $filepath"
  else
    echo "$content" > "$filepath"
    echo "  ✅ Created: $filepath"
  fi
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  CannaSaas — Scaffold API Client Hooks into React Apps"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Root: $ROOT"
echo ""

# ───────────────────────────────────────────────────────────────────────────────
# SHARED: QueryClient provider (used by both apps)
# ───────────────────────────────────────────────────────────────────────────────
echo "📦 [1/4] Shared providers..."

# ── Storefront QueryProvider ──────────────────────────────────────────────────
write_if_new "$ROOT/apps/storefront/src/providers/QueryProvider.tsx" \
'import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,      // 2 min
      gcTime: 10 * 60 * 1000,         // 10 min (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}'

# ── Admin QueryProvider ───────────────────────────────────────────────────────
write_if_new "$ROOT/apps/admin/src/providers/QueryProvider.tsx" \
'import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,           // 1 min — admin sees fresher data
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,      // admin tabs refetch on focus
    },
    mutations: {
      retry: 0,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}'

# ───────────────────────────────────────────────────────────────────────────────
# SHARED: AuthProvider (used by both apps)
# ───────────────────────────────────────────────────────────────────────────────
echo "🔐 [2/4] Auth providers..."

AUTH_PROVIDER_CONTENT='import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  useCurrentUser,
  useLogin,
  useLogout,
  tokenStore,
  type User,
  type LoginRequest,
} from "@cannasaas/api-client";
import { useNavigate } from "react-router-dom";

interface AuthContextValue {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (creds: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data: user, isLoading } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  // Listen for session-expired events from the Axios interceptor
  useEffect(() => {
    const handler = () => {
      navigate("/login", { replace: true });
    };
    window.addEventListener("cannasaas:session-expired", handler);
    return () =>
      window.removeEventListener("cannasaas:session-expired", handler);
  }, [navigate]);

  const login = useCallback(
    async (creds: LoginRequest) => {
      await loginMutation.mutateAsync(creds);
    },
    [loginMutation],
  );

  const logout = useCallback(() => {
    logoutMutation.mutate(undefined, {
      onSettled: () => navigate("/login", { replace: true }),
    });
  }, [logoutMutation, navigate]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}'

write_if_new "$ROOT/apps/storefront/src/providers/AuthProvider.tsx" "$AUTH_PROVIDER_CONTENT"
write_if_new "$ROOT/apps/admin/src/providers/AuthProvider.tsx" "$AUTH_PROVIDER_CONTENT"

# ───────────────────────────────────────────────────────────────────────────────
# STOREFRONT pages + components
# ───────────────────────────────────────────────────────────────────────────────
echo "🛒 [3/4] Storefront pages & components..."

# ── Login ─────────────────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/storefront/src/pages/Login.tsx" \
'import { useState, type FormEvent } from "react";
import { useLogin, tokenStore } from "@cannasaas/api-client";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const loginMutation = useLogin({
    onSuccess: () => navigate("/", { replace: true }),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Sign In</h1>

        {loginMutation.isError && (
          <p className="text-sm text-red-600">
            {loginMutation.error?.message ?? "Invalid credentials"}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loginMutation.isPending ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center text-sm text-gray-500">
          No account?{" "}
          <Link to="/register" className="text-green-600 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}'

# ── Register ──────────────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/storefront/src/pages/Register.tsx" \
'import { useState, type FormEvent } from "react";
import { useRegister } from "@cannasaas/api-client";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const registerMutation = useRegister({
    onSuccess: () => navigate("/", { replace: true }),
  });

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(form);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Create Account</h1>

        {registerMutation.isError && (
          <p className="text-sm text-red-600">
            {registerMutation.error?.message ?? "Registration failed"}
          </p>
        )}

        <div className="flex gap-2">
          <input
            placeholder="First Name"
            value={form.firstName}
            onChange={set("firstName")}
            className="w-1/2 rounded border px-3 py-2"
            required
          />
          <input
            placeholder="Last Name"
            value={form.lastName}
            onChange={set("lastName")}
            className="w-1/2 rounded border px-3 py-2"
            required
          />
        </div>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={set("email")}
          className="w-full rounded border px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={set("password")}
          className="w-full rounded border px-3 py-2"
          required
          minLength={8}
        />
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {registerMutation.isPending ? "Creating account..." : "Register"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-green-600 hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}'

# ── Products listing ──────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/storefront/src/pages/Products.tsx" \
'import { useState } from "react";
import {
  useProducts,
  type ProductFilters,
  type ProductCategory,
} from "@cannasaas/api-client";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading, isError } = useProducts(filters);

  const setCategory = (category?: ProductCategory) =>
    setFilters((prev) => ({ ...prev, category, page: 1 }));

  const setPage = (page: number) =>
    setFilters((prev) => ({ ...prev, page }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Products</h1>

      {/* Category filter bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            undefined,
            "flower",
            "pre_roll",
            "edible",
            "concentrate",
            "vape",
            "tincture",
            "topical",
          ] as const
        ).map((cat) => (
          <button
            key={cat ?? "all"}
            onClick={() => setCategory(cat as ProductCategory | undefined)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              filters.category === cat
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat ? cat.replace("_", " ") : "All"}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-gray-500">Loading products...</p>}
      {isError && <p className="text-red-600">Failed to load products.</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {data.meta.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: data.meta.totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`rounded px-3 py-1 text-sm ${
                    data.meta.page === i + 1
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}'

# ── Product Detail ────────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/storefront/src/pages/ProductDetail.tsx" \
'import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useProduct,
  useProductReviews,
  useAddToCart,
} from "@cannasaas/api-client";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const { data: reviewData } = useProductReviews(id!);
  const addToCart = useAddToCart();
  const [qty, setQty] = useState(1);

  if (isLoading) return <p className="p-8 text-gray-500">Loading...</p>;
  if (!product) return <p className="p-8 text-red-600">Product not found.</p>;

  const handleAdd = () => {
    addToCart.mutate({ productId: product.id, quantity: qty });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {product.strainType && (
            <span className="inline-block rounded-full bg-green-100 px-3 py-0.5 text-sm capitalize text-green-800">
              {product.strainType}
            </span>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          {(product.thcContent || product.cbdContent) && (
            <div className="flex gap-4 text-sm text-gray-600">
              {product.thcContent != null && <span>THC: {product.thcContent}%</span>}
              {product.cbdContent != null && <span>CBD: {product.cbdContent}%</span>}
            </div>
          )}

          <p className="text-gray-600">{product.description}</p>

          {/* Add to cart */}
          <div className="flex items-center gap-3 pt-2">
            <select
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="rounded border px-2 py-2"
            >
              {Array.from({ length: Math.min(product.quantity, 10) }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={addToCart.isPending || product.quantity === 0}
              className="flex-1 rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {addToCart.isPending
                ? "Adding..."
                : product.quantity === 0
                  ? "Out of Stock"
                  : "Add to Cart"}
            </button>
          </div>
          {addToCart.isSuccess && (
            <p className="text-sm text-green-600">Added to cart!</p>
          )}
        </div>
      </div>

      {/* Reviews */}
      {reviewData && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">
            Reviews ({reviewData.summary.totalReviews})
          </h2>
          <p className="mb-4 text-gray-600">
            Average: {reviewData.summary.averageRating.toFixed(1)} / 5
          </p>
          <div className="space-y-4">
            {reviewData.reviews.map((r) => (
              <div key={r.id} className="rounded border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {r.customerInfo.displayName}
                  </span>
                  <span className="text-sm text-gray-400">
                    {"⭐".repeat(r.rating)}
                  </span>
                </div>
                {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                {r.review && <p className="mt-1 text-gray-600">{r.review}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}'

# ── Cart page ─────────────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/storefront/src/pages/Cart.tsx" \
'import { Link } from "react-router-dom";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "@cannasaas/api-client";

export default function Cart() {
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();

  if (isLoading) return <p className="p-8 text-gray-500">Loading cart...</p>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-gray-500">Your cart is empty.</p>
        <Link to="/products" className="text-green-600 hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cart ({cart.items.length})</h1>
        <button
          onClick={() => clearCart.mutate()}
          className="text-sm text-red-500 hover:underline"
        >
          Clear cart
        </button>
      </div>

      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded border p-4"
          >
            <div>
              <p className="font-medium">{item.product.name}</p>
              <p className="text-sm text-gray-500">
                ${item.unitPrice.toFixed(2)} each
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={item.quantity}
                onChange={(e) =>
                  updateItem.mutate({
                    itemId: item.id,
                    payload: { quantity: Number(e.target.value) },
                  })
                }
                className="rounded border px-2 py-1"
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>

              <span className="w-20 text-right font-medium">
                ${item.totalPrice.toFixed(2)}
              </span>

              <button
                onClick={() => removeItem.mutate(item.id)}
                className="text-red-500 hover:text-red-700"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-6 space-y-2 border-t pt-4 text-right">
        <p className="text-sm text-gray-500">
          Subtotal: ${cart.subtotal.toFixed(2)}
        </p>
        {cart.discount > 0 && (
          <p className="text-sm text-green-600">
            Discount: -${cart.discount.toFixed(2)}
          </p>
        )}
        <p className="text-sm text-gray-500">Tax: ${cart.tax.toFixed(2)}</p>
        <p className="text-lg font-bold">Total: ${cart.total.toFixed(2)}</p>
      </div>

      <Link
        to="/checkout"
        className="mt-6 block rounded bg-green-600 py-3 text-center text-white hover:bg-green-700"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}'

# ── My Orders ─────────────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/storefront/src/pages/Orders.tsx" \
'import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrders, type OrderFilters } from "@cannasaas/api-client";

export default function Orders() {
  const [filters, setFilters] = useState<OrderFilters>({ page: 1, limit: 10 });
  const { data, isLoading } = useOrders(filters);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>

      {isLoading && <p className="text-gray-500">Loading orders...</p>}

      {data?.data.length === 0 && (
        <p className="text-gray-500">No orders yet.</p>
      )}

      <div className="space-y-4">
        {data?.data.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="block rounded border p-4 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()} •{" "}
                  {order.items.length} item{order.items.length !== 1 && "s"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">${order.total.toFixed(2)}</p>
                <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">
                  {order.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}'

# ── Order Detail ──────────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/storefront/src/pages/OrderDetail.tsx" \
'import { useParams } from "react-router-dom";
import { useOrder } from "@cannasaas/api-client";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id!);

  if (isLoading) return <p className="p-8 text-gray-500">Loading order...</p>;
  if (!order) return <p className="p-8 text-red-600">Order not found.</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">
        Order #{order.id.slice(0, 8)}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Placed {new Date(order.createdAt).toLocaleString()} •{" "}
        <span className="capitalize">{order.status.replace("_", " ")}</span>
      </p>

      <div className="space-y-3">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded border p-3"
          >
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
            <span className="font-medium">
              ${item.totalPrice.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-1 border-t pt-4 text-right">
        <p className="text-sm text-gray-500">
          Subtotal: ${order.subtotal.toFixed(2)}
        </p>
        {order.discount > 0 && (
          <p className="text-sm text-green-600">
            Discount: -${order.discount.toFixed(2)}
          </p>
        )}
        <p className="text-sm text-gray-500">Tax: ${order.tax.toFixed(2)}</p>
        <p className="text-lg font-bold">Total: ${order.total.toFixed(2)}</p>
      </div>
    </div>
  );
}'

# ── ProductCard component ─────────────────────────────────────────────────────
write_if_new "$ROOT/apps/storefront/src/components/ProductCard.tsx" \
'import { Link } from "react-router-dom";
import { useAddToCart, type Product } from "@cannasaas/api-client";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const addToCart = useAddToCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // don'\''t navigate when clicking the button
    addToCart.mutate({ productId: product.id, quantity: 1 });
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border hover:shadow-md"
    >
      <div className="aspect-square bg-gray-100">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium group-hover:text-green-600">
          {product.name}
        </h3>

        {product.strainType && (
          <span className="text-xs capitalize text-gray-500">
            {product.strainType}
          </span>
        )}

        <div className="mt-1 flex items-center justify-between">
          <span className="text-lg font-bold">
            ${product.price.toFixed(2)}
          </span>

          <button
            onClick={handleAdd}
            disabled={addToCart.isPending || product.quantity === 0}
            className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            {product.quantity === 0 ? "Sold Out" : "+ Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}'

# ── CartSummary component (header mini-cart) ──────────────────────────────────
write_if_new "$ROOT/apps/storefront/src/components/CartSummary.tsx" \
'import { Link } from "react-router-dom";
import { useCart } from "@cannasaas/api-client";

export default function CartSummary() {
  const { data: cart } = useCart();
  const count = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <Link
      to="/cart"
      className="relative inline-flex items-center gap-1 text-sm"
    >
      🛒
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
          {count}
        </span>
      )}
    </Link>
  );
}'

# ── Storefront main.tsx ───────────────────────────────────────────────────────
write_if_new "$ROOT/apps/storefront/src/main.tsx" \
'import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { tokenStore } from "@cannasaas/api-client";
import { QueryProvider } from "./providers/QueryProvider";
import { AuthProvider } from "./providers/AuthProvider";
import App from "./App";
import "./index.css";

// Set the tenant from subdomain or fallback
const subdomain = window.location.hostname.split(".")[0];
if (subdomain && subdomain !== "localhost" && subdomain !== "www") {
  tokenStore.setTenantId(subdomain);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  </React.StrictMode>,
);'

# ───────────────────────────────────────────────────────────────────────────────
# ADMIN pages
# ───────────────────────────────────────────────────────────────────────────────
echo "🖥️  [4/4] Admin pages..."

# ── Admin Login ───────────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/admin/src/pages/Login.tsx" \
'import { useState, type FormEvent } from "react";
import { useLogin } from "@cannasaas/api-client";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const loginMutation = useLogin({
    onSuccess: () => navigate("/", { replace: true }),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Admin Login</h1>

        {loginMutation.isError && (
          <p className="text-sm text-red-600">
            {loginMutation.error?.message ?? "Invalid credentials"}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loginMutation.isPending ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}'

# ── Dashboard ─────────────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/admin/src/pages/Dashboard/Dashboard.tsx" \
'import { useMemo } from "react";
import {
  useAnalyticsOverview,
  type AnalyticsDateRange,
} from "@cannasaas/api-client";
import { useAuth } from "../../providers/AuthProvider";

export default function Dashboard() {
  const { user } = useAuth();

  // Default to last 30 days
  const range = useMemo<AnalyticsDateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, []);

  // TODO: replace with actual dispensary ID from context/selector
  const dispensaryId = "DISPENSARY_ID";
  const { data: overview, isLoading } = useAnalyticsOverview(
    dispensaryId,
    range,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Dashboard{user ? ` — ${user.firstName}` : ""}
      </h1>

      {isLoading && <p className="text-gray-500">Loading analytics...</p>}

      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue"
            value={`$${overview.revenue.total.toLocaleString()}`}
            change={overview.revenue.change}
          />
          <StatCard
            label="Orders"
            value={overview.orders.total.toLocaleString()}
            change={overview.orders.change}
          />
          <StatCard
            label="Customers"
            value={overview.customers.total.toLocaleString()}
            change={overview.customers.change}
          />
          <StatCard
            label="Avg Order"
            value={`$${overview.avgOrderValue.value.toFixed(2)}`}
            change={overview.avgOrderValue.change}
          />
        </div>
      )}

      {overview?.topProducts && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Top Products</h2>
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Revenue</th>
                <th className="py-2 text-right">Sold</th>
              </tr>
            </thead>
            <tbody>
              {overview.topProducts.map((p) => (
                <tr key={p.productId} className="border-b">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2 text-right">
                    ${p.revenue.toLocaleString()}
                  </td>
                  <td className="py-2 text-right">{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p
        className={`mt-1 text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}
      >
        {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
      </p>
    </div>
  );
}'

# ── Product Management ────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/admin/src/pages/Products/ProductList.tsx" \
'import { useState } from "react";
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
}'

# ── Order Management ──────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/admin/src/pages/Orders/OrderList.tsx" \
'import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrders, type OrderFilters } from "@cannasaas/api-client";

export default function OrderList() {
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 25,
  });
  const { data, isLoading } = useOrders(filters);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>

      {/* Status filter */}
      <div className="flex gap-2">
        {[undefined, "pending", "confirmed", "preparing", "ready_for_pickup", "completed", "cancelled"].map(
          (status) => (
            <button
              key={status ?? "all"}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  status: status as OrderFilters["status"],
                  page: 1,
                }))
              }
              className={`rounded-full px-3 py-1 text-xs capitalize ${
                filters.status === status
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status ? status.replace("_", " ") : "All"}
            </button>
          ),
        )}
      </div>

      {isLoading && <p className="text-gray-500">Loading...</p>}

      {data && (
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="py-2">Order</th>
              <th className="py-2">Date</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Items</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-green-600 hover:underline"
                  >
                    #{order.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="py-2">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2">
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">
                    {order.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-2 text-right">{order.items.length}</td>
                <td className="py-2 text-right font-medium">
                  ${order.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}'

# ── Admin Order Detail ────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/admin/src/pages/Orders/OrderDetail.tsx" \
'import { useParams } from "react-router-dom";
import {
  useOrder,
  useUpdateOrderStatus,
  useCancelOrder,
  type OrderStatus,
} from "@cannasaas/api-client";

const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "completed",
];

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id!);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();

  if (isLoading) return <p className="p-4 text-gray-500">Loading...</p>;
  if (!order) return <p className="p-4 text-red-600">Order not found.</p>;

  const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-sm capitalize text-gray-500">
            {order.status.replace("_", " ")} •{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          {nextStatus && (
            <button
              onClick={() =>
                updateStatus.mutate({ id: order.id, status: nextStatus })
              }
              disabled={updateStatus.isPending}
              className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              Move to {nextStatus.replace("_", " ")}
            </button>
          )}
          {order.status !== "cancelled" && order.status !== "completed" && (
            <button
              onClick={() => {
                if (window.confirm("Cancel this order?")) {
                  cancelOrder.mutate(order.id);
                }
              }}
              disabled={cancelOrder.isPending}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="border-b text-gray-500">
          <tr>
            <th className="py-2">Product</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{item.productName}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
              <td className="py-2 text-right">${item.totalPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1 text-right text-sm">
        <p className="text-gray-500">Subtotal: ${order.subtotal.toFixed(2)}</p>
        {order.discount > 0 && (
          <p className="text-green-600">Discount: -${order.discount.toFixed(2)}</p>
        )}
        <p className="text-gray-500">Tax: ${order.tax.toFixed(2)}</p>
        <p className="text-lg font-bold">Total: ${order.total.toFixed(2)}</p>
      </div>
    </div>
  );
}'

# ── Admin main.tsx ────────────────────────────────────────────────────────────
write_if_new "$ROOT/apps/admin/src/main.tsx" \
'import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { tokenStore } from "@cannasaas/api-client";
import { QueryProvider } from "./providers/QueryProvider";
import { AuthProvider } from "./providers/AuthProvider";
import App from "./App";
import "./index.css";

// Set tenant from env or subdomain
const tenantId =
  import.meta.env.VITE_TENANT_ID ??
  window.location.hostname.split(".")[0];
if (tenantId && tenantId !== "localhost" && tenantId !== "www") {
  tokenStore.setTenantId(tenantId);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  </React.StrictMode>,
);'

# ───────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Done! Files scaffolded."
echo ""
echo "  Next steps:"
echo "    1. cd $ROOT"
echo "    2. pnpm install   (or npm install)"
echo "    3. Make sure both apps list these in package.json:"
echo "       \"@cannasaas/api-client\": \"workspace:*\""
echo "       \"@tanstack/react-query\": \"^5.62.0\""
echo "       \"@tanstack/react-query-devtools\": \"^5.62.0\""
echo "       \"react-router-dom\": \"^6.x\""
echo "    4. Wire up routes in each app's routes.tsx / App.tsx"
echo "═══════════════════════════════════════════════════════════════"
