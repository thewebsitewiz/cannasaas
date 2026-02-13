#!/bin/bash
# ============================================================
# CannaSaas - Fix All 90 Remaining Compilation Errors
# Run from: cannasaas-api/
# ============================================================

set -euo pipefail
FIXED=0

echo ""
echo "Fixing all compilation errors..."
echo "=================================================="

# ============================================================
# 1. CRASH FIX: order-item.entity.ts stray "sa;" on line 52
# ============================================================
echo ""
echo "[1] Fixing order-item.entity.ts stray 'sa;'..."
if grep -q '^sa;$' src/orders/entities/order-item.entity.ts 2>/dev/null; then
  sed -i '' '/^sa;$/d' src/orders/entities/order-item.entity.ts
  echo "  FIXED"
  FIXED=$((FIXED + 1))
else
  echo "  SKIP"
fi

# ============================================================
# 2. FIX: orders.module.ts duplicate imports (lines 2-5)
# ============================================================
echo ""
echo "[2] Fixing orders.module.ts duplicate imports..."
if [ -f src/orders/orders.module.ts ]; then
  # Read file, deduplicate import lines, write back
  awk '!seen[$0]++' src/orders/orders.module.ts > /tmp/orders-module-fix.ts
  cp /tmp/orders-module-fix.ts src/orders/orders.module.ts
  rm /tmp/orders-module-fix.ts
  echo "  FIXED"
  FIXED=$((FIXED + 1))
fi

# ============================================================
# 3. FIX: tenants.service.spec.ts typo
# ============================================================
echo ""
echo "[3] Fixing tenants.service.spec.ts typo..."
if grep -q "repPository" src/tenants/tenants.service.spec.ts 2>/dev/null; then
  sed -i '' 's/repPository/repository/g' src/tenants/tenants.service.spec.ts
  echo "  FIXED"
  FIXED=$((FIXED + 1))
else
  echo "  SKIP"
fi

# ============================================================
# 4. INSTALL: missing npm packages
# ============================================================
echo ""
echo "[4] Installing missing npm packages..."
npm install --save \
  @nestjs/event-emitter \
  @nestjs/schedule \
  @nestjs/websockets \
  @nestjs/platform-socket.io \
  socket.io \
  2>&1 | tail -3
FIXED=$((FIXED + 1))

# ============================================================
# 5. FIX: Organization entity - add ALL missing fields
# ============================================================
echo ""
echo "[5] Rewriting Organization entity with all fields..."

cat > src/modules/organizations/organization.entity.ts << 'ENDOFFILE'
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'legal_name', length: 255, nullable: true })
  legalName: string;

  @Column({ name: 'contact_email', length: 255 })
  contactEmail: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ length: 30, default: 'starter' })
  plan: string;

  @Column({ name: 'subscription_status', length: 30, default: 'trialing' })
  subscriptionStatus: string;

  @Column({ name: 'stripe_customer_id', length: 100, nullable: true })
  stripeCustomerId: string;

  @Column({ name: 'stripe_subscription_id', length: 100, nullable: true })
  stripeSubscriptionId: string;

  @Column({ name: 'stripe_connected_account_id', length: 100, nullable: true })
  stripeConnectedAccountId: string;

  @Column({ name: 'onboarding_step', length: 30, nullable: true })
  onboardingStep: string;

  @Column({ name: 'completed_steps', type: 'simple-array', nullable: true })
  completedSteps: string[];

  @Column({ name: 'onboarding_complete', type: 'boolean', default: false })
  onboardingComplete: boolean;

  @Column({ type: 'jsonb', nullable: true })
  branding: Record<string, any>;

  @Column({ name: 'compliance_config', type: 'jsonb', nullable: true })
  complianceConfig: {
    ageVerificationRequired?: boolean;
    medicalOnly?: boolean;
    requireIdScan?: boolean;
    dailyPurchaseLimit?: number;
    minAge?: number;
  };

  @Column({ name: 'license_number', length: 50, nullable: true })
  licenseNumber: string;

  @Column({ name: 'license_type', length: 20, nullable: true })
  licenseType: string;

  @Column({ name: 'max_daily_purchase_grams', type: 'decimal', precision: 6, scale: 2, default: 28.5 })
  maxDailyPurchaseGrams: number;

  @Column({ name: 'age_verification_required', type: 'boolean', default: true })
  ageVerificationRequired: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
ENDOFFILE
echo "  FIXED"
FIXED=$((FIXED + 1))

# ============================================================
# 6. FIX: MailService - add ALL missing methods
# ============================================================
echo ""
echo "[6] Rewriting MailService with all methods..."

cat > src/modules/mail/mail.service.ts << 'ENDOFFILE'
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendBetaInvitation(data: { to: string; name: string; code: string }) {
    this.logger.log(`[STUB] Beta invitation to ${data.to} with code ${data.code}`);
  }

  async sendStaffInvitation(data: { to: string; orgName: string; orgId: string; role?: string }) {
    this.logger.log(`[STUB] Staff invitation to ${data.to} for org ${data.orgName}`);
  }

  async sendAbandonedCartEmail(data: { to: string; name: string; cartItems: any[]; resumeUrl: string }) {
    this.logger.log(`[STUB] Abandoned cart email to ${data.to}`);
  }

  async sendTemplateEmail(data: { to: string; subject: string; template: string; variables?: Record<string, any> }) {
    this.logger.log(`[STUB] Template email to ${data.to}: ${data.subject}`);
  }

  async sendWinBackEmail(data: { to: string; name: string; lastOrderDate: Date; offerCode?: string }) {
    this.logger.log(`[STUB] Win-back email to ${data.to}`);
  }

  async sendEmail(data: { to: string; subject: string; html: string }) {
    this.logger.log(`[STUB] Email to ${data.to}: ${data.subject}`);
  }
}
ENDOFFILE
echo "  FIXED"
FIXED=$((FIXED + 1))

# ============================================================
# 7. FIX: StripeService stub (for onboarding)
# ============================================================
echo ""
echo "[7] Writing StripeService stub..."

mkdir -p src/modules/payments
cat > src/modules/payments/stripe.service.ts << 'ENDOFFILE'
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  async createConnectedAccount(data: { email: string; businessName: string; country?: string }) {
    this.logger.log(`[STUB] Creating Stripe connected account for ${data.email}`);
    return { id: `acct_stub_${Date.now()}` };
  }

  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
    this.logger.log(`[STUB] Creating account link for ${accountId}`);
    return { url: returnUrl };
  }
}
ENDOFFILE
echo "  FIXED"
FIXED=$((FIXED + 1))

# ============================================================
# 8. FIX: Inventory entities (TS2306 not a module)
# ============================================================
echo ""
echo "[8] Rewriting inventory entities..."

mkdir -p src/modules/inventory/entities
cat > src/modules/inventory/entities/inventory-item.entity.ts << 'ENDOFFILE'
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('inventory_items')
@Index(['productId', 'variantId', 'locationId'], { unique: true })
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId: string;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @Column({ name: 'quantity_on_hand', type: 'int', default: 0 })
  quantityOnHand: number;

  @Column({ name: 'quantity_reserved', type: 'int', default: 0 })
  quantityReserved: number;

  @Column({ name: 'low_stock_threshold', type: 'int', default: 10 })
  lowStockThreshold: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
ENDOFFILE

cat > src/modules/inventory/entities/stock-movement.entity.ts << 'ENDOFFILE'
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inventory_item_id', type: 'uuid' })
  inventoryItemId: string;

  @Column({ length: 30 })
  type: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'previous_quantity', type: 'int' })
  previousQuantity: number;

  @Column({ name: 'new_quantity', type: 'int' })
  newQuantity: number;

  @Column({ length: 255, nullable: true })
  reason: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
ENDOFFILE
echo "  FIXED"
FIXED=$((FIXED + 1))

# ============================================================
# 9. FIX: Loyalty entities (TS2306 not a module)
# ============================================================
echo ""
echo "[9] Rewriting loyalty entities..."

mkdir -p src/modules/loyalty/entities
cat > src/modules/loyalty/entities/loyalty-account.entity.ts << 'ENDOFFILE'
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('loyalty_accounts')
@Index(['userId', 'organizationId'], { unique: true })
export class LoyaltyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ name: 'lifetime_points', type: 'int', default: 0 })
  lifetimePoints: number;

  @Column({ length: 20, default: 'bronze' })
  tier: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
ENDOFFILE

cat > src/modules/loyalty/entities/loyalty-transaction.entity.ts << 'ENDOFFILE'
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @Column({ type: 'int' })
  points: number;

  @Column({ length: 30 })
  type: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
ENDOFFILE
echo "  FIXED"
FIXED=$((FIXED + 1))

# ============================================================
# 10. FIX: Marketing entity (TS2306 not a module)
# ============================================================
echo ""
echo "[10] Rewriting marketing entity..."

mkdir -p src/modules/marketing/entities
cat > src/modules/marketing/entities/marketing-log.entity.ts << 'ENDOFFILE'
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('marketing_logs')
export class MarketingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ length: 50 })
  campaign: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 30 })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}
ENDOFFILE
echo "  FIXED"
FIXED=$((FIXED + 1))

# ============================================================
# 11. FIX: Cart entity re-export barrel
# ============================================================
echo ""
echo "[11] Writing cart entity barrel..."

mkdir -p src/modules/cart/entities
cat > src/modules/cart/entities/cart.entity.ts << 'ENDOFFILE'
// Re-export Sprint 1-6 Cart entity for Sprint 7+ module imports
export { Cart } from '../../../cart/entities/cart.entity';
ENDOFFILE
echo "  FIXED"
FIXED=$((FIXED + 1))

# ============================================================
# 12. FIX: Product entity - add Sprint 7+ fields
# ============================================================
echo ""
echo "[12] Adding Sprint 7+ fields to Product entity..."

# Check which file the Product entity lives in
PRODUCT_FILE=""
if [ -f src/products/entities/product.entity.ts ]; then
  PRODUCT_FILE="src/products/entities/product.entity.ts"
fi

if [ -n "$PRODUCT_FILE" ] && ! grep -q "aiDescription" "$PRODUCT_FILE" 2>/dev/null; then
  # Find the last @Column or field before the closing brace and add new fields
  # Add before the final closing brace of the class
  sed -i '' '/^}$/i\
\
  @Column({ name: "ai_description", type: "text", nullable: true })\
  aiDescription: string;\
\
  @Column({ name: "ai_description_generated_at", type: "timestamptz", nullable: true })\
  aiDescriptionGeneratedAt: Date;\
\
  @Column({ type: "simple-array", nullable: true })\
  terpenes: string[];\
\
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })\
  price: number;
' "$PRODUCT_FILE"
  echo "  FIXED: added aiDescription, aiDescriptionGeneratedAt, terpenes, price"
  FIXED=$((FIXED + 1))
else
  echo "  SKIP: fields already exist or file not found"
fi

# ============================================================
# 13. FIX: User entity - add Sprint 7+ fields
# ============================================================
echo ""
echo "[13] Adding Sprint 7+ fields to User entity..."

USER_FILE=""
if [ -f src/auth/entities/user.entity.ts ]; then
  USER_FILE="src/auth/entities/user.entity.ts"
elif [ -f src/users/entities/user.entity.ts ]; then
  USER_FILE="src/users/entities/user.entity.ts"
fi

if [ -n "$USER_FILE" ] && ! grep -q "dateOfBirth" "$USER_FILE" 2>/dev/null; then
  sed -i '' '/^}$/i\
\
  @Column({ name: "date_of_birth", type: "date", nullable: true })\
  dateOfBirth: Date;\
\
  @Column({ name: "id_verified_at", type: "timestamptz", nullable: true })\
  idVerifiedAt: Date;
' "$USER_FILE"
  echo "  FIXED: added dateOfBirth, idVerifiedAt to $USER_FILE"
  FIXED=$((FIXED + 1))
else
  echo "  SKIP: fields already exist or file not found"
fi

# ============================================================
# 14. FIX: Order entity - add Sprint 7+ fields
# ============================================================
echo ""
echo "[14] Adding Sprint 7+ fields to Order entity..."

ORDER_FILE=""
if [ -f src/orders/entities/order.entity.ts ]; then
  ORDER_FILE="src/orders/entities/order.entity.ts"
fi

if [ -n "$ORDER_FILE" ] && ! grep -q "customerId" "$ORDER_FILE" 2>/dev/null; then
  sed -i '' '/^}$/i\
\
  @Column({ name: "customer_id", type: "uuid", nullable: true })\
  customerId: string;\
\
  @Column({ name: "total_weight", type: "decimal", precision: 10, scale: 2, nullable: true })\
  totalWeight: number;
' "$ORDER_FILE"
  echo "  FIXED: added customerId, totalWeight to $ORDER_FILE"
  FIXED=$((FIXED + 1))
else
  echo "  SKIP: fields already exist or file not found"
fi

# ============================================================
# 15. FIX: Stripe apiVersion
# ============================================================
echo ""
echo "[15] Fixing Stripe API version..."
if grep -q "2024-12-18.acacia" src/modules/billing/billing.service.ts 2>/dev/null; then
  sed -i '' "s/'2024-12-18.acacia'/'2026-01-28.clover'/" src/modules/billing/billing.service.ts
  echo "  FIXED"
  FIXED=$((FIXED + 1))
else
  echo "  SKIP"
fi

# ============================================================
# 16. FIX: Review service import path
# ============================================================
echo ""
echo "[16] Fixing review service import path..."
if grep -q "from '../orders/order.service'" src/modules/reviews/review.service.ts 2>/dev/null; then
  sed -i '' "s|from '../orders/order.service'|from '../../orders/orders.service'|" src/modules/reviews/review.service.ts
  echo "  FIXED"
  FIXED=$((FIXED + 1))
else
  echo "  SKIP"
fi

# ============================================================
# 17. FIX: orders.service.ts cart import
# ============================================================
echo ""
echo "[17] Fixing orders.service.ts cart import..."
if grep -q "from './cart.service'" src/orders/orders.service.ts 2>/dev/null; then
  sed -i '' "s|from './cart.service'|from '../cart/cart.service'|" src/orders/orders.service.ts
  echo "  FIXED"
  FIXED=$((FIXED + 1))
elif grep -q "from './cart.service'" src/orders/orders.service.ts 2>/dev/null; then
  echo "  SKIP: path looks correct"
else
  echo "  SKIP: import not found"
fi

# ============================================================
# 18. FIX: request-logger User.id
# ============================================================
echo ""
echo "[18] Fixing request-logger User.id access..."
if grep -q "req\['user'\]?.id" src/common/middleware/request-logger.middleware.ts 2>/dev/null; then
  sed -i '' "s/req\['user'\]?.id/req['user']?.['id']/" src/common/middleware/request-logger.middleware.ts 2>/dev/null || \
  sed -i '' "s/req\[.user.\]\?\.id/(req['user'] as any)?.id/" src/common/middleware/request-logger.middleware.ts
  echo "  FIXED"
  FIXED=$((FIXED + 1))
else
  echo "  SKIP"
fi

# ============================================================
# SUMMARY
# ============================================================

echo ""
echo "============================================"
echo "Applied $FIXED fixes"
echo "============================================"
echo ""
echo "Restart: npm run start:dev"
echo ""
