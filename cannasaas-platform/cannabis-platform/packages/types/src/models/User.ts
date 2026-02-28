export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'manager'
  | 'budtender'
  | 'driver'
  | 'customer';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organizationId: string;
  roles: UserRole[];
  permissions: string[];
  dispensaryIds: string[];
  isAgeVerified: boolean;
  ageVerifiedAt?: string;
  isMedicalPatient: boolean;
  medicalCardExpiry?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  roles: UserRole[];
  permissions: string[];
  iat: number;
  exp: number;
}
