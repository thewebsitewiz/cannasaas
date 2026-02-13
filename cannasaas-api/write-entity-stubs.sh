#!/bin/bash
# ============================================================
# CannaSaas - Write Empty Entity Files (Sprint 7+)
#
# These entities are referenced by Sprint 7+ services but
# were not included in the guide. Generated from service
# property access patterns.
#
# Run from: cannasaas-api/
# ============================================================

set -euo pipefail

WRITTEN=0

write_file() {
  local filepath="$1"
  local dir
  dir=$(dirname "$filepath")
  mkdir -p "$dir"
  if [ ! -s "$filepath" ]; then
    cat > "$filepath"
    echo "  WROTE $filepath"
    WRITTEN=$((WRITTEN + 1))
  else
    cat > /dev/null
    echo "  SKIP  $filepath (already has content)"
  fi
}

echo ""
echo "Writing Sprint 7+ entity stubs..."
echo "=================================================="

# ============================================================
# 1. AnalyticsEvent Entity
# ============================================================

write_file "src/modules/analytics/entities/analytics-event.entity.ts" << 'ENDOFFILE'
// cannasaas-api/src/modules/analytics/entities/analytics-event.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('analytics_events')
@Index(['organizationId', 'timestamp'])
@Index(['organizationId', 'eventType'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'event_type', length: 50 })
  eventType: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'session_id', length: 100 })
  sessionId: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;
}
ENDOFFILE

# ============================================================
# 2. ApiKey Entity
# ============================================================

write_file "src/modules/api-keys/entities/api-key.entity.ts" << 'ENDOFFILE'
// cannasaas-api/src/modules/api-keys/entities/api-key.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('api_keys')
@Index(['organizationId'])
@Index(['hashedKey'])
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'hashed_key', length: 64, unique: true })
  hashedKey: string;

  @Column({ length: 10 })
  prefix: string;

  @Column({ type: 'simple-array' })
  permissions: string[];

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'request_count', type: 'int', default: 0 })
  requestCount: number;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
ENDOFFILE

# ============================================================
# 3. BetaInvitation Entity
# ============================================================

write_file "src/modules/beta/entities/beta-invitation.entity.ts" << 'ENDOFFILE'
// cannasaas-api/src/modules/beta/entities/beta-invitation.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('beta_invitations')
@Index(['code'], { unique: true })
@Index(['email'])
export class BetaInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
ENDOFFILE

# ============================================================
# 4. BetaFeedback Entity
# ============================================================

write_file "src/modules/beta/entities/beta-feedback.entity.ts" << 'ENDOFFILE'
// cannasaas-api/src/modules/beta/entities/beta-feedback.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('beta_feedback')
@Index(['organizationId'])
@Index(['type', 'severity'])
export class BetaFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ length: 30 })
  type: 'bug' | 'feature_request' | 'usability' | 'general';

  @Column({ length: 20 })
  severity: 'low' | 'medium' | 'high' | 'critical';

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
ENDOFFILE

# ============================================================
# 5. AuditLog Entity
# ============================================================

write_file "src/modules/compliance/audit/entities/audit-log.entity.ts" << 'ENDOFFILE'
// cannasaas-api/src/modules/compliance/audit/entities/audit-log.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['organizationId', 'timestamp'])
@Index(['organizationId', 'resource'])
@Index(['userId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ length: 30 })
  action: string;

  @Column({ length: 50 })
  resource: string;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string;

  @Column({ length: 20 })
  severity: string;

  @Column({ type: 'jsonb' })
  details: Record<string, any>;

  @Column({ name: 'previous_state', type: 'jsonb', nullable: true })
  previousState: Record<string, any>;

  @Column({ name: 'new_state', type: 'jsonb', nullable: true })
  newState: Record<string, any>;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ length: 64 })
  hash: string;

  @Column({ type: 'timestamptz' })
  timestamp: Date;
}
ENDOFFILE

# ============================================================
# 6. Delivery Entity
# ============================================================

write_file "src/modules/delivery/entities/delivery.entity.ts" << 'ENDOFFILE'
// cannasaas-api/src/modules/delivery/entities/delivery.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  ARRIVING = 'arriving',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('deliveries')
@Index(['orderId'])
@Index(['driverId', 'status'])
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'driver_id', type: 'uuid', nullable: true })
  driverId: string;

  @Column({ name: 'driver_name', length: 255, nullable: true })
  driverName: string;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  // Destination coordinates
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng: number;

  // Current driver coordinates
  @Column({ name: 'current_lat', type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLat: number;

  @Column({ name: 'current_lng', type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLng: number;

  @Column({ name: 'estimated_minutes', type: 'int', nullable: true })
  estimatedMinutes: number;

  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  deliveryAddress: string;

  @Column({ name: 'customer_phone', length: 20, nullable: true })
  customerPhone: string;

  @Column({ name: 'assigned_at', type: 'timestamptz', nullable: true })
  assignedAt: Date;

  @Column({ name: 'picked_up_at', type: 'timestamptz', nullable: true })
  pickedUpAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
ENDOFFILE

# ============================================================
# 7. MailService stub
# ============================================================

write_file "src/modules/mail/mail.service.ts" << 'ENDOFFILE'
// cannasaas-api/src/modules/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendBetaInvitation(data: { to: string; name: string; code: string }) {
    // TODO: Integrate SendGrid or your email provider
    this.logger.log(`[STUB] Beta invitation email to ${data.to} with code ${data.code}`);
  }

  async sendEmail(data: { to: string; subject: string; html: string }) {
    // TODO: Integrate SendGrid or your email provider
    this.logger.log(`[STUB] Email to ${data.to}: ${data.subject}`);
  }
}
ENDOFFILE

# ============================================================
# 8. MailModule
# ============================================================

write_file "src/modules/mail/mail.module.ts" << 'ENDOFFILE'
// cannasaas-api/src/modules/mail/mail.module.ts
import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
ENDOFFILE

# ============================================================
# 9. Organization Entity (for billing.service + compliance.guard)
#    Only written if modules/organizations/ path doesn't exist
# ============================================================

write_file "src/modules/organizations/organization.entity.ts" << 'ENDOFFILE'
// cannasaas-api/src/modules/organizations/organization.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'legal_name', length: 255 })
  legalName: string;

  @Column({ name: 'contact_email', length: 255 })
  contactEmail: string;

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

# ============================================================
# 10. Fix feature-flag entity filename typo
#     Error shows: eature-flag.entity.ts (missing 'f')
# ============================================================

echo ""
echo "Checking for feature-flag filename typo..."
if [ -f "src/modules/feature-flags/entities/eature-flag.entity.ts" ]; then
  if [ -s "src/modules/feature-flags/entities/feature-flag.entity.ts" ]; then
    rm "src/modules/feature-flags/entities/eature-flag.entity.ts"
    echo "  DELETED eature-flag.entity.ts (correct file already exists)"
  else
    mv "src/modules/feature-flags/entities/eature-flag.entity.ts" \
       "src/modules/feature-flags/entities/feature-flag.entity.ts"
    echo "  RENAMED eature-flag.entity.ts -> feature-flag.entity.ts"
  fi
else
  echo "  No typo found (ok)"
fi

# ============================================================
# SUMMARY
# ============================================================

echo ""
echo "============================================"
echo "Entity stubs written: $WRITTEN files"
echo "============================================"
# ============================================================
# 11. Re-export barrels for Sprint 1-6 → Sprint 7+ path bridge
#
#     Sprint 1-6 entities live at: src/products/, src/orders/, src/users/
#     Sprint 7+ services import:   src/modules/products/, src/modules/orders/, etc.
#     These barrel files bridge the gap.
# ============================================================

echo ""
echo "Writing re-export barrels for path bridging..."

# Products
write_file "src/modules/products/entities/product.entity.ts" << 'ENDOFFILE'
// Re-export Sprint 1-6 Product entity for Sprint 7+ module imports
export { Product } from '../../../products/entities/product.entity';
ENDOFFILE

# Orders
write_file "src/modules/orders/entities/order.entity.ts" << 'ENDOFFILE'
// Re-export Sprint 1-6 Order entity for Sprint 7+ module imports
export { Order } from '../../../orders/entities/order.entity';
ENDOFFILE

# Users
write_file "src/modules/users/entities/user.entity.ts" << 'ENDOFFILE'
// Re-export Sprint 1-6 User entity for Sprint 7+ module imports
export { User } from '../../../users/entities/user.entity';
ENDOFFILE

echo ""
echo "Next steps:"
echo "  1. Install missing packages:"
echo "     npm install nest-winston winston nanoid @anthropic-ai/sdk stripe axios cacheable"
echo ""
echo "  2. Restart the compiler: npm run start:dev"
echo ""
