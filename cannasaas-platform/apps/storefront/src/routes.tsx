import { RouteObject } from 'react-router-dom';

/* ── Layouts ─────────────────────────────────────────────── */
import RootLayout from '@/layouts/RootLayout';
import AuthLayout from '@/layouts/AuthLayout';

/* ── Guards ──────────────────────────────────────────────── */
import ProtectedRoute from '@/components/ProtectedRoute';

/* ── Pages ──────────────────────────────────────────────── */
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Account from '@/pages/Account';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import DispensaryLocator from '@/pages/DispensaryLocator';
import NotFound from '@/pages/NotFound';

/* ── Account Sub-sections ───────────────────────────────── */
import {
  ProfileSection,
  OrderHistory,
  SavedAddresses,
  LoyaltyDashboard,
  NotificationPreferences,
} from '@/components/account';

/* ── Route Tree ─────────────────────────────────────────── */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      /* ── Public ────────────────────────────────────────── */
      { index: true, element: <Home /> },
      { path: 'shop', element: <Shop /> },
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
