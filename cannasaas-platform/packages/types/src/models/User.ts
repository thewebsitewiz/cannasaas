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
  dispensaryIds: string[]; // Dispensaries this user can access
  isAgeVerified: boolean;
  ageVerifiedAt?: string;
  isMedicalPatient: boolean;
  medicalCardExpiry?: string;
  loyaltyPoints: number;
  createdAt: string;
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
