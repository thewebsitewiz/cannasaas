import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Minus, Trash2, UserPlus, ShoppingCart, CheckCircle,
  Leaf, Loader2, X, AlertTriangle, User,
} from 'lucide-react';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';

// ── GraphQL ──────────────────────────────────────────────────

const PRODUCTS_QUERY = `query($dispensaryId: ID!, $search: String, $limit: Int) {
  products(dispensaryId: $dispensaryId, search: $search, limit: $limit) {
    id name strainType thcPercent cbdPercent
    variants { variantId name retailPrice stockQuantity stockStatus quantityPerUnit }
  }
}`;

const SEARCH_CUSTOMERS = `query($dispensaryId: ID!, $query: String!, $limit: Int) {
  searchCustomers(dispensaryId: $dispensaryId, query: $query, limit: $limit) {
    userId email firstName lastName phone ageVerified totalOrders
  }
}`;

const CREATE_WALKIN = `mutation($input: CreateWalkInCustomerInput!) {
  createWalkInCustomer(input: $input) {
    userId email firstName lastName phone ageVerified totalOrders
  }
}`;

const CREATE_ORDER = `mutation($input: CreateOrderInput!) {
  createOrder(input: $input) {
    orderId orderStatus subtotal taxTotal total lineItemCount
  }
}`;

// ── Types ────────────────────────────────────────────────────

interface Variant {
  variantId: string; name: string; retailPrice: number | null;
  stockQuantity: number | null; stockStatus: string | null; quantityPerUnit: number | null;
}
interface Product {
  id: string; name: string; strainType: string | null;
  thcPercent: number | null; cbdPercent: number | null; variants: Variant[];
}
interface Customer {
  userId: string; email: string; firstName?: string; lastName?: string;
  phone?: string; ageVerified: boolean; totalOrders: number;
}
interface CartItem {
  productId: string; variantId: string; productName: string;
  variantName: string; price: number; quantity: number; maxStock: number;
}

const STRAIN_COLORS: Record<string, string> = {
  sativa: 'bg-orange-100 text-orange-700',
  indica: 'bg-purple-100 text-purple-700',
  hybrid: 'bg-green-100 text-green-700',
};

// ── Component ────────────────────────────────────────────────

export function NewOrderPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const queryClient = useQueryClient();

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Customer search
  const [custSearch, setCustSearch] = useState('');
  const [debouncedCust, setDebouncedCust] = useState('');
  const [showCustSearch, setShowCustSearch] = useState(false);
  const [showNewCustForm, setShowNewCustForm] = useState(false);
  const [newCust, setNewCust] = useState({ firstName: '', lastName: '', phone: '', email: '' });

  // Order result
  const [orderResult, setOrderResult] = useState<any>(null);

  // Debounce product search
  const prodTimer = useRef<any>(null);
  const handleProductSearch = (val: string) => {
    setProductSearch(val);
    clearTimeout(prodTimer.current);
    prodTimer.current = setTimeout(() => setDebouncedSearch(val), 250);
  };

  // Debounce customer search
  const custTimer = useRef<any>(null);
  const handleCustSearch = (val: string) => {
    setCustSearch(val);
    clearTimeout(custTimer.current);
    custTimer.current = setTimeout(() => setDebouncedCust(val), 300);
  };

  // ── Queries ────────────────────────────────────────────────

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['posProducts', dispensaryId, debouncedSearch],
    queryFn: () => gqlRequest<{ products: Product[] }>(PRODUCTS_QUERY, {
      dispensaryId, search: debouncedSearch || undefined, limit: 30,
    }),
    select: (d) => d.products,
    enabled: !!dispensaryId,
  });

  const { data: custResults } = useQuery({
    queryKey: ['custSearch', dispensaryId, debouncedCust],
    queryFn: () => gqlRequest<{ searchCustomers: Customer[] }>(SEARCH_CUSTOMERS, {
      dispensaryId, query: debouncedCust, limit: 8,
    }),
    select: (d) => d.searchCustomers,
    enabled: !!dispensaryId && debouncedCust.length >= 2,
  });

  // ── Mutations ──────────────────────────────────────────────

  const createCustomer = useMutation({
    mutationFn: () => gqlRequest<{ createWalkInCustomer: Customer }>(CREATE_WALKIN, {
      input: { ...newCust, dispensaryId },
    }),
    onSuccess: (data) => {
      setCustomer(data.createWalkInCustomer);
      setShowNewCustForm(false);
      setShowCustSearch(false);
      setNewCust({ firstName: '', lastName: '', phone: '', email: '' });
    },
  });

  const placeOrder = useMutation({
    mutationFn: () => gqlRequest<{ createOrder: any }>(CREATE_ORDER, {
      input: {
        dispensaryId,
        customerUserId: customer!.userId,
        orderType: 'in_store',
        lineItems: cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      },
    }),
    onSuccess: (data) => {
      setOrderResult(data.createOrder);
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['staffDashboard'] });
    },
  });

  // ── Cart helpers ───────────────────────────────────────────

  const addToCart = useCallback((product: Product, variant: Variant) => {
    const price = variant.retailPrice ? Number(variant.retailPrice) : 0;
    const maxStock = variant.stockQuantity != null ? Number(variant.stockQuantity) : 999;
    if (maxStock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variant.variantId);
      if (existing) {
        if (existing.quantity >= maxStock) return prev;
        return prev.map((i) =>
          i.variantId === variant.variantId
            ? { ...i, quantity: Math.min(i.quantity + 1, maxStock) }
            : i,
        );
      }
      return [...prev, {
        productId: product.id, variantId: variant.variantId,
        productName: product.name, variantName: variant.name,
        price, quantity: 1, maxStock,
      }];
    });
  }, []);

  const updateQty = useCallback((variantId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((i) => i.variantId !== variantId);
      return prev.map((i) =>
        i.variantId === variantId
          ? { ...i, quantity: Math.min(qty, i.maxStock) }
          : i,
      );
    });
  }, []);

  const removeFromCart = useCallback((variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // ── Reset for new order ────────────────────────────────────

  const startNewOrder = () => {
    setCart([]);
    setCustomer(null);
    setOrderResult(null);
    setProductSearch('');
    setDebouncedSearch('');
  };

  // ── Order success screen ───────────────────────────────────

  if (orderResult) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
          <CheckCircle size={56} className="mx-auto text-green-600 mb-4" />
          <h2 className="text-2xl font-bold text-green-800">Order Placed</h2>
          <p className="text-sm text-green-600 mt-1">
            #{orderResult.orderId.slice(0, 8).toUpperCase()}
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <p className="text-green-700">
              Customer: <strong>{customer?.firstName} {customer?.lastName}</strong>
            </p>
            <p className="text-green-700">
              Items: <strong>{orderResult.lineItemCount}</strong>
            </p>
            <div className="border-t border-green-200 pt-3 mt-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-green-600">Subtotal</span>
                <span className="font-medium">${parseFloat(orderResult.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Tax</span>
                <span className="font-medium">${parseFloat(orderResult.taxTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-green-800 pt-1">
                <span>Total</span>
                <span>${parseFloat(orderResult.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={startNewOrder}
            className="mt-6 bg-green-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            New Order
          </button>
        </div>
      </div>
    );
  }

  // ── Main POS layout ────────────────────────────────────────

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)]">
      {/* ── LEFT: Product Browser ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">New Order</h1>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => handleProductSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto -mr-2 pr-2">
          {productsLoading ? (
            <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
              <Loader2 size={16} className="animate-spin" /> Loading products...
            </div>
          ) : (products ?? []).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Leaf size={32} className="mx-auto mb-2 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {(products ?? []).map((product) => (
                <div key={product.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                    {product.strainType && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STRAIN_COLORS[product.strainType] ?? STRAIN_COLORS.hybrid}`}>
                        {product.strainType}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 mb-3">
                    {product.thcPercent != null && <span>THC {product.thcPercent}%</span>}
                    {product.cbdPercent != null && <span>CBD {product.cbdPercent}%</span>}
                  </div>
                  <div className="space-y-1.5">
                    {product.variants.map((v) => {
                      const price = v.retailPrice ? Number(v.retailPrice) : 0;
                      const stock = v.stockQuantity != null ? Number(v.stockQuantity) : null;
                      const oos = v.stockStatus === 'out_of_stock' || stock === 0;
                      const inCart = cart.find((i) => i.variantId === v.variantId);

                      return (
                        <div
                          key={v.variantId}
                          className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${oos ? 'opacity-40' : 'hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-gray-700 font-medium truncate">{v.name}</span>
                            {v.quantityPerUnit && (
                              <span className="text-[10px] text-gray-400">{v.quantityPerUnit}g</span>
                            )}
                            {stock != null && stock <= 5 && stock > 0 && (
                              <span className="text-[10px] text-amber-600 font-medium">{stock} left</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold text-gray-900 tabular-nums">
                              {price > 0 ? `$${price.toFixed(2)}` : '—'}
                            </span>
                            {oos ? (
                              <span className="text-[10px] text-red-500 font-medium w-16 text-center">Sold Out</span>
                            ) : (
                              <button
                                onClick={() => addToCart(product, v)}
                                disabled={inCart != null && inCart.quantity >= (stock ?? 999)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  inCart
                                    ? 'bg-brand-100 text-brand-700'
                                    : 'bg-brand-600 text-white hover:bg-brand-700'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart + Customer ────────────────────────────── */}
      <div className="w-96 flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden shrink-0">

        {/* Customer Section */}
        <div className="p-4 border-b border-gray-100">
          {customer ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 rounded-full">
                  <User size={16} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {customer.phone || customer.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setCustomer(null); setShowCustSearch(true); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Change
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer by name, phone, email..."
                  value={custSearch}
                  onChange={(e) => { handleCustSearch(e.target.value); setShowCustSearch(true); }}
                  onFocus={() => setShowCustSearch(true)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>

              {/* Customer search results */}
              {showCustSearch && debouncedCust.length >= 2 && (
                <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {(custResults ?? []).map((c) => (
                    <button
                      key={c.userId}
                      onClick={() => { setCustomer(c); setShowCustSearch(false); setCustSearch(''); setDebouncedCust(''); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {c.phone && `${c.phone} · `}{c.email}
                        {c.totalOrders > 0 && ` · ${c.totalOrders} orders`}
                      </p>
                    </button>
                  ))}
                  {(custResults ?? []).length === 0 && (
                    <div className="px-3 py-4 text-center text-xs text-gray-400">
                      No customers found for "{debouncedCust}"
                    </div>
                  )}
                </div>
              )}

              {/* New customer button/form */}
              {!showNewCustForm ? (
                <button
                  onClick={() => setShowNewCustForm(true)}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-sm text-brand-600 font-medium border border-dashed border-brand-300 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  <UserPlus size={14} /> New Walk-In Customer
                </button>
              ) : (
                <div className="mt-2 border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">New Customer</span>
                    <button onClick={() => setShowNewCustForm(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="First name *"
                      value={newCust.firstName}
                      onChange={(e) => setNewCust((p) => ({ ...p, firstName: e.target.value }))}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-500"
                    />
                    <input
                      placeholder="Last name"
                      value={newCust.lastName}
                      onChange={(e) => setNewCust((p) => ({ ...p, lastName: e.target.value }))}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                  <input
                    placeholder="Phone"
                    value={newCust.phone}
                    onChange={(e) => setNewCust((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-500"
                  />
                  <input
                    placeholder="Email (optional)"
                    value={newCust.email}
                    onChange={(e) => setNewCust((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={() => createCustomer.mutate()}
                    disabled={!newCust.firstName.trim() || createCustomer.isPending}
                    className="w-full bg-brand-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createCustomer.isPending ? 'Creating...' : 'Create Customer'}
                  </button>
                  {createCustomer.isError && (
                    <p className="text-xs text-red-500">{(createCustomer.error as Error).message}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart size={32} className="mb-2" />
              <p className="text-sm">Add products to the order</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.variantId} className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.variantName}</p>
                    <p className="text-xs text-gray-400">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.variantId, item.quantity - 1)}
                      className="p-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums">${(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal ({cartCount} items)</span>
            <span className="font-bold tabular-nums">${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Tax calculated at order creation</span>
          </div>

          {/* Validation warnings */}
          {!customer && cart.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              <AlertTriangle size={14} />
              Select or create a customer to place the order
            </div>
          )}

          <button
            onClick={() => placeOrder.mutate()}
            disabled={cart.length === 0 || !customer || placeOrder.isPending}
            className="w-full bg-brand-600 text-white font-bold text-base py-3.5 rounded-xl hover:bg-brand-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {placeOrder.isPending ? (
              <><Loader2 size={18} className="animate-spin" /> Placing Order...</>
            ) : (
              <><ShoppingCart size={18} /> Place Order — ${cartTotal.toFixed(2)}</>
            )}
          </button>

          {placeOrder.isError && (
            <p className="text-xs text-red-500 text-center">
              {(placeOrder.error as Error).message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewOrderPage;
