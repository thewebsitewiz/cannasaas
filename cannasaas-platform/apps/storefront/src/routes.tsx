/* ── Account Sub-sections ───────────────────────────────── */
import {
  LoyaltyDashboard,
  NotificationPreferences,
  OrderHistory,
  ProfileSection,
  SavedAddresses,
} from '@/components/account';

import About from '@/pages/About';
import Account from '@/pages/Account';
import AuthLayout from '@/layouts/AuthLayout';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Contact from '@/pages/Contact';
import DispensaryLocator from '@/pages/DispensaryLocator';
import ForgotPassword from '@/pages/ForgotPassword';
/* ── Pages ──────────────────────────────────────────────── */
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import ProductDetail from '@/pages/ProductDetail';
/* ── Guards ──────────────────────────────────────────────── */
import ProtectedRoute from '@/components/ProtectedRoute';
import { RecommendedProducts } from '@/components/products/detail';
import Register from '@/pages/Register';
import ResetPassword from '@/pages/ResetPassword';
/* ── Layouts ─────────────────────────────────────────────── */
import RootLayout from '@/layouts/RootLayout';
import { RouteObject } from 'react-router-dom';
import Shop from '@/pages/Shop';

/* ── Route Tree ─────────────────────────────────────────── */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      /* ── Public ────────────────────────────────────────── */
      { index: true, element: <Home /> },
      { path: 'product', element: <RecommendedProducts /> },
      { path: 'shop/:categorySlug', element: <Shop /> },
      { path: 'product/:productId', element: <ProductDetail /> },
      { path: 'dispensaries', element: <DispensaryLocator /> },
      { path: 'about', element: <About /> },
      { path: 'contact', element: <Contact /> },

      /* ── Cart & Checkout ───────────────────────────────── */
      { path: 'cart', element: <Cart /> },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        ),
      },

      /* ── Account (protected, nested) ──────────────────── */
      {
        path: 'account',
        element: (
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ProfileSection /> },
          { path: 'orders', element: <OrderHistory /> },
          { path: 'addresses', element: <SavedAddresses /> },
          { path: 'loyalty', element: <LoyaltyDashboard /> },
          { path: 'notifications', element: <NotificationPreferences /> },
        ],
      },

      /* ── Catch-all ─────────────────────────────────────── */
      { path: '*', element: <NotFound /> },
    ],
  },

  /* ── Auth (separate layout, no nav/footer) ───────────── */
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
    ],
  },
];
