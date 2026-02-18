import ProtectedRoute from '@/components/ProtectedRoute';
import Account from '@/pages/Account';
import {
  ProfileSection, OrderHistory, SavedAddresses,
  LoyaltyDashboard, NotificationPreferences,
} from '@/components/account';

{
  path: 'account',
  element: (
    <ProtectedRoute>
      <Account />
    </ProtectedRoute>
  ),
  children: [
    { index: true,          element: <ProfileSection /> },
    { path: 'orders',       element: <OrderHistory /> },
    { path: 'addresses',    element: <SavedAddresses /> },
    { path: 'loyalty',      element: <LoyaltyDashboard /> },
    { path: 'notifications', element: <NotificationPreferences /> },
  ],
}