export type ComplianceEventType =
  | 'sale'
  | 'return'
  | 'inventory_adjustment'
  | 'inventory_received'
  | 'inventory_destroyed'
  | 'id_verification'
  | 'purchase_limit_check';

export interface PurchaseLimitResult {
  allowed: boolean;
  violations: string[];
  remaining: {
    flowerOz: number;
    concentrateG: number;
    edibleMg: number;
  };
  windowHours: number;
  state: 'NY' | 'NJ' | 'CT';
}

export interface ComplianceLog {
  id: string;
  dispensaryId: string;
  eventType: ComplianceEventType;
  details: Record<string, unknown>;
  performedBy?: string;
  createdAt: string;
}
