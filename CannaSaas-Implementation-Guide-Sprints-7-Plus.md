# CannaSaas Implementation Guide: Sprints 7+

**Launch Strategy through Production Deployment**

Version 2.1 | February 2026
NestJS + React + PostgreSQL + Redis

---

## File Location Legend

Every code block in this guide is tagged with its target application:

| Tag               | Application            | Directory                   | Stack                                  |
| ----------------- | ---------------------- | --------------------------- | -------------------------------------- |
| 🔧 **BACKEND**    | NestJS API Server      | `cannasaas-api/src/`        | NestJS, TypeORM, PostgreSQL, Redis     |
| 🖥️ **ADMIN**      | Admin Dashboard        | `cannasaas-admin/src/`      | React, TypeScript, Tailwind, shadcn/ui |
| 🛒 **STOREFRONT** | Customer Storefront    | `cannasaas-storefront/src/` | React, TypeScript, Tailwind, shadcn/ui |
| 📦 **SHARED**     | Used by both frontends | Either frontend `src/`      | React hooks, utilities                 |
| ⚙️ **CONFIG**     | Infrastructure/Config  | Project root or `public/`   | Docker, manifests, config files        |

---

## Table of Contents

- **7** Launch Strategy
  - 7.1 Feature Flag System
  - 7.2 Customer Onboarding
  - 7.3 Beta Launch Infrastructure
  - 7.4 Analytics & Event Tracking
  - 7.5 Marketing Automation
- **8** Monitoring & Observability
  - 8.1 Health Checks & Readiness
  - 8.2 Structured Logging
  - 8.3 Error Tracking (Sentry)
  - 8.4 Performance Metrics & Alerting
- **9** Enhanced Commerce (Phase 2)
  - 9.1 Reviews & Ratings System
  - 9.2 Loyalty Program
  - 9.3 Promotions Engine
  - 9.4 Inventory Management
- **10** Operations & Analytics (Phase 3)
  - 10.1 Delivery Tracking
  - 10.2 Advanced Analytics Dashboard
  - 10.3 Real-Time Notifications (WebSocket)
- **11** AI Integration (Phase 4)
  - 11.1 AI Product Descriptions
  - 11.2 AI Chatbot
  - 11.3 Demand Forecasting
- **12** Growth & Subscriptions (Phase 5)
  - 12.1 Subscription & Billing (Stripe)
  - 12.2 Progressive Web App (PWA)
  - 12.3 Public REST API & API Keys
- **13** Enterprise & Compliance (Phase 6)
  - 13.1 METRC Integration
  - 13.2 Age Verification & Purchase Limits
  - 13.3 Audit Trail System
- **Appendices**
  - A.1 Environment Variable Reference
  - A.2 Success Metrics
  - A.3 Risk Mitigation Matrix
  - A.4 Glossary

---

## 7. Launch Strategy

This section covers the complete launch infrastructure for CannaSaas, from feature flag gating and customer onboarding through beta testing, analytics, and marketing automation. Each subsection includes production-ready NestJS services and React frontend components.

### 7.1 Feature Flag System

Feature flags allow granular control over which features are available to each tenant based on their subscription plan. The system uses Redis caching with database-backed overrides, ensuring fast lookups with administrative flexibility.

#### Feature Flag Entity

> 🔧 **BACKEND** · `cannasaas-api/src/modules/feature-flags/entities/feature-flag.entity.ts`

Defines the available features and maps them to subscription plans with organization-level overrides stored as JSONB.

```typescript
// cannasaas-api/src/modules/feature-flags/entities/feature-flag.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum Feature {
  MULTI_LOCATION = 'multi_location',
  SUBSCRIPTION_ORDERS = 'subscription_orders',
  LOYALTY_PROGRAM = 'loyalty_program',
  AI_RECOMMENDATIONS = 'ai_recommendations',
  AI_CHATBOT = 'ai_chatbot',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  CUSTOM_DOMAIN = 'custom_domain',
  API_ACCESS = 'api_access',
  GIFT_CARDS = 'gift_cards',
  DELIVERY_TRACKING = 'delivery_tracking',
  METRC_INTEGRATION = 'metrc_integration',
  WHITE_LABEL = 'white_label',
  BULK_IMPORT = 'bulk_import',
  MULTI_CURRENCY = 'multi_currency',
}

export enum Plan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export const PLAN_FEATURES: Record<Plan, Feature[]> = {
  [Plan.STARTER]: [Feature.DELIVERY_TRACKING, Feature.GIFT_CARDS],
  [Plan.PROFESSIONAL]: [
    Feature.DELIVERY_TRACKING,
    Feature.GIFT_CARDS,
    Feature.MULTI_LOCATION,
    Feature.SUBSCRIPTION_ORDERS,
    Feature.LOYALTY_PROGRAM,
    Feature.AI_RECOMMENDATIONS,
    Feature.ADVANCED_ANALYTICS,
    Feature.BULK_IMPORT,
  ],
  [Plan.ENTERPRISE]: Object.values(Feature),
};

@Entity('feature_flags')
@Index(['organizationId'])
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  organizationId: string;

  @Column({ type: 'enum', enum: Plan })
  plan: Plan;

  @Column({ type: 'jsonb', default: {} })
  overrides: Record<string, boolean>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### Feature Flag Service

> 🔧 **BACKEND** · `cannasaas-api/src/modules/feature-flags/feature-flag.service.ts`

Provides cached lookups with Redis (5-minute TTL) and supports per-organization overrides. Cache is invalidated on plan changes or override updates.

```typescript
// cannasaas-api/src/modules/feature-flags/feature-flag.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  FeatureFlag,
  Feature,
  Plan,
  PLAN_FEATURES,
} from './entities/feature-flag.entity';

@Injectable()
export class FeatureFlagService {
  private readonly TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(FeatureFlag)
    private flagRepo: Repository<FeatureFlag>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async isEnabled(orgId: string, feature: Feature): Promise<boolean> {
    const cacheKey = `ff:${orgId}:${feature}`;
    const cached = await this.cache.get<boolean>(cacheKey);
    if (cached !== undefined && cached !== null) return cached;

    const flag = await this.flagRepo.findOne({
      where: { organizationId: orgId },
    });
    if (!flag) return false;

    // Check org-specific overrides first, then plan defaults
    if (flag.overrides[feature] !== undefined) {
      await this.cache.set(cacheKey, flag.overrides[feature], this.TTL);
      return flag.overrides[feature];
    }

    const enabled = PLAN_FEATURES[flag.plan]?.includes(feature) ?? false;
    await this.cache.set(cacheKey, enabled, this.TTL);
    return enabled;
  }

  async getAllFlags(orgId: string): Promise<Record<Feature, boolean>> {
    const flag = await this.flagRepo.findOne({
      where: { organizationId: orgId },
    });
    const result = {} as Record<Feature, boolean>;
    for (const f of Object.values(Feature)) {
      if (flag?.overrides[f] !== undefined) {
        result[f] = flag.overrides[f];
      } else {
        result[f] = PLAN_FEATURES[flag?.plan]?.includes(f) ?? false;
      }
    }
    return result;
  }

  async setOverride(orgId: string, feature: Feature, enabled: boolean) {
    const flag = await this.flagRepo.findOneOrFail({
      where: { organizationId: orgId },
    });
    flag.overrides = { ...flag.overrides, [feature]: enabled };
    await this.flagRepo.save(flag);
    await this.cache.del(`ff:${orgId}:${feature}`);
  }

  async invalidateCache(orgId: string) {
    for (const f of Object.values(Feature)) {
      await this.cache.del(`ff:${orgId}:${f}`);
    }
  }
}
```

#### Feature Flag Guard & Decorator

> 🔧 **BACKEND** · `cannasaas-api/src/modules/feature-flags/feature-flag.guard.ts`

```typescript
// cannasaas-api/src/modules/feature-flags/feature-flag.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService } from './feature-flag.service';
import { Feature } from './entities/feature-flag.entity';

export const FEATURE_KEY = 'required_feature';
export const RequireFeature = (feature: Feature) =>
  SetMetadata(FEATURE_KEY, feature);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlags: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<Feature>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!feature) return true;

    const request = context.switchToHttp().getRequest();
    const orgId = request.user?.organizationId;
    if (!orgId) throw new ForbiddenException('No organization context');

    const enabled = await this.featureFlags.isEnabled(orgId, feature);
    if (!enabled) {
      throw new ForbiddenException(
        `Feature "${feature}" not available on your plan. Upgrade to access.`,
      );
    }
    return true;
  }
}

// Usage in any controller:
// @UseGuards(AuthGuard, FeatureFlagGuard)
// @RequireFeature(Feature.AI_RECOMMENDATIONS)
// @Get('recommendations')
// async getRecommendations() { ... }
```

#### Feature Availability Matrix

| Feature             | Starter | Professional | Enterprise |
| ------------------- | ------- | ------------ | ---------- |
| Delivery Tracking   | Yes     | Yes          | Yes        |
| Gift Cards          | Yes     | Yes          | Yes        |
| Multi-Location      | -       | Yes          | Yes        |
| Subscription Orders | -       | Yes          | Yes        |
| Loyalty Program     | -       | Yes          | Yes        |
| AI Recommendations  | -       | Yes          | Yes        |
| Advanced Analytics  | -       | Yes          | Yes        |
| Bulk Import         | -       | Yes          | Yes        |
| AI Chatbot          | -       | -            | Yes        |
| Custom Domain       | -       | -            | Yes        |
| API Access          | -       | -            | Yes        |
| METRC Integration   | -       | -            | Yes        |
| White Label         | -       | -            | Yes        |

---

### 7.2 Customer Onboarding System

A guided multi-step wizard walks new dispensary owners through complete store setup. Each step validates data, provisions integrations (Stripe Connected Accounts, compliance), and tracks progress so users can resume at any point.

#### Onboarding Service

> 🔧 **BACKEND** · `cannasaas-api/src/modules/onboarding/onboarding.service.ts`

```typescript
// cannasaas-api/src/modules/onboarding/onboarding.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { StripeService } from '../payments/stripe.service';
import { MailService } from '../mail/mail.service';

export enum OnboardingStep {
  BUSINESS_INFO = 'business_info',
  BRANDING = 'branding',
  LOCATIONS = 'locations',
  PAYMENT_PROCESSING = 'payment_processing',
  FIRST_PRODUCTS = 'first_products',
  STAFF_INVITE = 'staff_invite',
  COMPLIANCE = 'compliance',
  REVIEW_LAUNCH = 'review_launch',
}

const STEP_ORDER = Object.values(OnboardingStep);

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    private stripe: StripeService,
    private mail: MailService,
  ) {}

  async getStatus(orgId: string) {
    const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });
    return {
      currentStep: org.onboardingStep || OnboardingStep.BUSINESS_INFO,
      completedSteps: org.completedSteps || [],
      progress: ((org.completedSteps?.length || 0) / STEP_ORDER.length) * 100,
    };
  }

  async processStep(orgId: string, step: OnboardingStep, data: any) {
    const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });

    switch (step) {
      case OnboardingStep.BUSINESS_INFO:
        org.name = data.businessName;
        org.legalName = data.legalName;
        org.licenseNumber = data.licenseNumber;
        org.licenseType = data.licenseType;
        org.contactEmail = data.email;
        org.contactPhone = data.phone;
        org.slug = this.generateSlug(data.businessName);
        break;

      case OnboardingStep.BRANDING:
        org.branding = {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          logoUrl: data.logoUrl,
          faviconUrl: data.faviconUrl,
        };
        break;

      case OnboardingStep.PAYMENT_PROCESSING:
        const account = await this.stripe.createConnectedAccount({
          email: org.contactEmail,
          businessName: org.legalName,
          country: 'US',
        });
        org.stripeConnectedAccountId = account.id;
        break;

      case OnboardingStep.STAFF_INVITE:
        for (const email of data.emails || []) {
          await this.mail.sendStaffInvitation({
            to: email,
            orgName: org.name,
            orgId: org.id,
          });
        }
        break;

      case OnboardingStep.COMPLIANCE:
        org.complianceConfig = {
          ageVerificationRequired: data.ageVerification ?? true,
          medicalOnly: data.medicalOnly ?? false,
          dailyPurchaseLimit: data.dailyLimit,
          requireIdScan: data.requireIdScan ?? false,
        };
        break;
    }

    if (!org.completedSteps) org.completedSteps = [];
    if (!org.completedSteps.includes(step)) org.completedSteps.push(step);

    const idx = STEP_ORDER.indexOf(step);
    org.onboardingStep =
      idx < STEP_ORDER.length - 1
        ? STEP_ORDER[idx + 1]
        : OnboardingStep.REVIEW_LAUNCH;
    if (idx === STEP_ORDER.length - 1) org.onboardingComplete = true;

    await this.orgRepo.save(org);
    return this.getStatus(orgId);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
```

#### React Onboarding Wizard

> 🖥️ **ADMIN** · `cannasaas-admin/src/components/onboarding/OnboardingWizard.tsx`
>
> This component is used by dispensary owners/admins during initial store setup.

```tsx
// cannasaas-admin/src/components/onboarding/OnboardingWizard.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from 'lucide-react';

const STEPS = [
  { key: 'business_info', label: 'Business Info' },
  { key: 'branding', label: 'Branding' },
  { key: 'locations', label: 'Locations' },
  { key: 'payment_processing', label: 'Payments' },
  { key: 'first_products', label: 'Products' },
  { key: 'staff_invite', label: 'Staff' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'review_launch', label: 'Launch' },
];

export function OnboardingWizard() {
  const [idx, setIdx] = useState(0);

  const { data: status, refetch } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => apiClient.get('/onboarding/status').then((r) => r.data),
  });

  const submit = useMutation({
    mutationFn: ({ step, data }: { step: string; data: any }) =>
      apiClient.post(`/onboarding/steps/${step}`, data),
    onSuccess: () => {
      refetch();
      if (idx < STEPS.length - 1) setIdx((i) => i + 1);
    },
  });

  useEffect(() => {
    if (status?.currentStep) {
      const i = STEPS.findIndex((s) => s.key === status.currentStep);
      if (i >= 0) setIdx(i);
    }
  }, [status]);

  const completed = status?.completedSteps || [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Set Up Your Store</h1>
        <Progress value={status?.progress || 0} className="mt-4" />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => setIdx(i)}
            className={`flex flex-col items-center gap-1 text-xs
              ${i === idx ? 'text-green-700 font-bold' : 'text-gray-400'}`}
          >
            {completed.includes(step.key) ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
            {step.label}
          </button>
        ))}
      </div>

      {/* Current step form renders here via dynamic component */}
      <div className="rounded-lg border p-6">
        <p className="text-sm text-muted">
          Step {idx + 1} of {STEPS.length}
        </p>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={idx === 0}
          onClick={() => setIdx((i) => i - 1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button variant="outline" onClick={() => setIdx((i) => i + 1)}>
          Skip <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

---

### 7.3 Beta Launch Infrastructure

The beta system manages invitation-based access with expiration codes, automated onboarding for accepted invitations, structured feedback collection with severity levels, and metrics dashboards to track beta program health.

#### Beta Service

> 🔧 **BACKEND** · `cannasaas-api/src/modules/beta/beta.service.ts`

```typescript
// cannasaas-api/src/modules/beta/beta.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { nanoid } from 'nanoid';
import { BetaInvitation } from './entities/beta-invitation.entity';
import { BetaFeedback } from './entities/beta-feedback.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BetaService {
  constructor(
  }

  async acceptInvitation(code: string) {
    const invite = await this.inviteRepo.findOne({ where: { code } });
    if (!invite) throw new NotFoundException('Invalid invitation code');
    if (invite.acceptedAt) throw new BadRequestException('Already accepted');
    if (invite.expiresAt < new Date())
      throw new BadRequestException('Invitation expired');

    invite.acceptedAt = new Date();
    await this.inviteRepo.save(invite);
    return invite;
  }

  async submitFeedback(dto: {
    organizationId: string; userId: string;
    type: 'bug' | 'feature_request' | 'usability' | 'general';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string; description: string;
    metadata?: Record<string, any>;
  }) {
    return this.feedbackRepo.save(this.feedbackRepo.create(dto));
  }

  async getMetrics() {
    const total = await this.inviteRepo.count();
    const accepted = await this.inviteRepo.count({
      where: { acceptedAt: Not(IsNull()) },
    });
    const feedbackCount = await this.feedbackRepo.count();
    const criticalBugs = await this.feedbackRepo.count({
      where: { type: 'bug', severity: 'critical' },
    });
    return {
      totalInvitations: total, acceptedInvitations: accepted,
      conversionRate: total > 0 ? (accepted / total * 100).toFixed(1) : '0',
      totalFeedback: feedbackCount, criticalBugs,
    };
  }
}
```

#### Beta Feedback Widget

> 🖥️ **ADMIN** · `cannasaas-admin/src/components/beta/BetaFeedbackWidget.tsx`
>
> Floating feedback button shown to admin users during beta period. Can also be added to the storefront for customer feedback.

```tsx
// cannasaas-admin/src/components/beta/BetaFeedbackWidget.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageSquarePlus, Bug, Lightbulb, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';

const TYPES = [
  { value: 'bug', label: 'Bug', icon: Bug, color: 'text-red-500' },
  {
    value: 'feature_request',
    label: 'Feature',
    icon: Lightbulb,
    color: 'text-yellow-500',
  },
  { value: 'usability', label: 'UX', icon: Star, color: 'text-blue-500' },
  {
    value: 'general',
    label: 'General',
    icon: MessageSquarePlus,
    color: 'text-gray-500',
  },
];

export function BetaFeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [severity, setSeverity] = useState('medium');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const submit = useMutation({
    mutationFn: (data: any) => apiClient.post('/beta/feedback', data),
    onSuccess: () => {
      setOpen(false);
      setTitle('');
      setDesc('');
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-green-700
          p-4 text-white shadow-lg hover:bg-green-800 transition"
      >
        <MessageSquarePlus className="h-6 w-6" />
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 w-96 rounded-lg
          border bg-white p-6 shadow-xl"
        >
          <h3 className="font-semibold mb-4">Send Beta Feedback</h3>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1 rounded-lg
                  border p-2 text-xs ${
                    type === t.value ? 'border-green-600 bg-green-50' : ''
                  }`}
              >
                <t.icon className={`h-5 w-5 ${t.color}`} />
                {t.label}
              </button>
            ))}
          </div>

          {type === 'bug' && (
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full mb-3 rounded border p-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          )}

          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-3"
          />
          <Textarea
            placeholder="Describe..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="mb-4"
          />

          <Button
            className="w-full"
            disabled={!title || !desc}
            onClick={() =>
              submit.mutate({
                type,
                severity,
                title,
                description: desc,
                metadata: {
                  url: window.location.href,
                  userAgent: navigator.userAgent,
                },
              })
            }
          >
            {submit.isPending ? 'Sending...' : 'Submit'}
          </Button>
        </div>
      )}
    </>
  );
}
```

---

### 7.4 Analytics & Event Tracking

Dual-persistence event tracking uses PostgreSQL for historical queries and Redis for real-time counters. The React hook provides fire-and-forget client-side posting with automatic page view tracking.

#### Analytics Service

> 🔧 **BACKEND** · `cannasaas-api/src/modules/analytics/analytics.service.ts`

```typescript
// cannasaas-api/src/modules/analytics/analytics.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AnalyticsEvent } from './entities/analytics-event.entity';

export enum EventType {
  PAGE_VIEW = 'page_view',
  PRODUCT_VIEW = 'product_view',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  BEGIN_CHECKOUT = 'begin_checkout',
  PURCHASE = 'purchase',
  REFUND = 'refund',
  SIGN_UP = 'sign_up',
  LOGIN = 'login',
  SEARCH = 'search',
  REVIEW_SUBMITTED = 'review_submitted',
  WISHLIST_ADD = 'wishlist_add',
  SHARE = 'share',
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private eventRepo: Repository<AnalyticsEvent>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async trackEvent(event: {
    organizationId: string;
    eventType: EventType;
    userId?: string;
    sessionId: string;
    data?: Record<string, any>;
  }) {
    const entity = this.eventRepo.create({ ...event, timestamp: new Date() });
    await this.eventRepo.save(entity);

    // Real-time Redis counters
    const dateKey = new Date().toISOString().slice(0, 10);
    const prefix = `analytics:${event.organizationId}:${dateKey}`;
    const countKey = `${prefix}:${event.eventType}`;
    const current = (await this.cache.get<number>(countKey)) || 0;
    await this.cache.set(countKey, current + 1, 86400);

    if (event.eventType === EventType.PURCHASE && event.data?.total) {
      const revKey = `${prefix}:revenue`;
      const rev = (await this.cache.get<number>(revKey)) || 0;
      await this.cache.set(revKey, rev + event.data.total, 86400);
    }
  }

  async getDashboard(orgId: string, start: Date, end: Date) {
    const events = await this.eventRepo.find({
      where: { organizationId: orgId, timestamp: Between(start, end) },
    });
    const purchases = events.filter((e) => e.eventType === EventType.PURCHASE);
    const revenue = purchases.reduce((s, e) => s + (e.data?.total || 0), 0);
    const visitors = new Set(events.map((e) => e.sessionId)).size;

    return {
      revenue,
      orderCount: purchases.length,
      avgOrderValue: purchases.length > 0 ? revenue / purchases.length : 0,
      uniqueVisitors: visitors,
      conversionRate:
        visitors > 0 ? ((purchases.length / visitors) * 100).toFixed(2) : '0',
      topProducts: this.getTopProducts(events),
    };
  }

  private getTopProducts(events: AnalyticsEvent[]) {
    const views = events.filter((e) => e.eventType === EventType.PRODUCT_VIEW);
    const counts: Record<string, { name: string; views: number }> = {};
    views.forEach((e) => {
      const id = e.data?.productId;
      if (!id) return;
      if (!counts[id])
        counts[id] = { name: e.data?.productName || id, views: 0 };
      counts[id].views++;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b.views - a.views)
      .slice(0, 10)
      .map(([id, d]) => ({ productId: id, ...d }));
  }
}
```

#### React useAnalytics Hook

> 🛒 **STOREFRONT** · `cannasaas-storefront/src/hooks/useAnalytics.ts`
>
> Tracks customer-facing events (page views, product views, cart actions, purchases). Fire-and-forget — does not block UI.

```typescript
// cannasaas-storefront/src/hooks/useAnalytics.ts
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { nanoid } from 'nanoid';

const SESSION_KEY = 'cs_session_id';
function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = nanoid();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useAnalytics() {
  const location = useLocation();
  const sessionId = useRef(getSessionId());

  const track = useCallback((eventType: string, data?: Record<string, any>) => {
    fetch('/api/v1/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        sessionId: sessionId.current,
        data,
        context: { url: window.location.href, referrer: document.referrer },
      }),
    }).catch(() => {}); // Fire-and-forget
  }, []);

  useEffect(() => {
    track('page_view', { path: location.pathname });
  }, [location.pathname, track]);

  return {
    track,
    trackProductView: (id: string, name: string) =>
      track('product_view', { productId: id, productName: name }),
    trackAddToCart: (productId: string, qty: number, price: number) =>
      track('add_to_cart', { productId, quantity: qty, price }),
    trackPurchase: (orderId: string, total: number, items: number) =>
      track('purchase', { orderId, total, itemCount: items }),
    trackSearch: (query: string, results: number) =>
      track('search', { query, resultCount: results }),
  };
}
```

---

### 7.5 Marketing Automation

Cron-based automation handles abandoned cart recovery (30-min intervals, 1-hour threshold), welcome drip series (4-email sequence), and win-back campaigns (30-day inactivity). Each campaign has cooldown periods to prevent over-messaging.

#### Campaign Service

> 🔧 **BACKEND** · `cannasaas-api/src/modules/marketing/campaign.service.ts`

```typescript
// cannasaas-api/src/modules/marketing/campaign.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { Cart } from '../cart/entities/cart.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { MarketingLog } from './entities/marketing-log.entity';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(MarketingLog) private logRepo: Repository<MarketingLog>,
    private mail: MailService,
  ) {}

  // Abandoned Cart Recovery - every 30 minutes
  @Cron('*/30 * * * *')
  async processAbandonedCarts() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const carts = await this.cartRepo.find({
      where: { updatedAt: LessThan(oneHourAgo), checkedOut: false },
      relations: ['user'],
    });

    for (const cart of carts) {
      if (!cart.user?.email) continue;
      const recent = await this.logRepo.findOne({
        where: {
          userId: cart.userId,
          campaignType: 'abandoned_cart',
          sentAt: MoreThan(oneDayAgo),
        },
      });
      if (recent) continue;

      await this.mail.sendAbandonedCartEmail({
        to: cart.user.email,
        firstName: cart.user.firstName,
        cartItems: cart.items,
        cartTotal: cart.total,
        recoveryUrl: `/cart?recover=${cart.id}`,
        couponCode: 'COMEBACK10',
      });
      await this.logRepo.save(
        this.logRepo.create({
          userId: cart.userId,
          campaignType: 'abandoned_cart',
          sentAt: new Date(),
          channel: 'email',
        }),
      );
    }
  }

  // Welcome Drip - every hour
  @Cron(CronExpression.EVERY_HOUR)
  async processWelcomeSeries() {
    const steps = [
      { day: 0, template: 'welcome_1', subject: 'Welcome to {{store}}!' },
      { day: 2, template: 'welcome_2', subject: 'Discover our top products' },
      { day: 5, template: 'welcome_3', subject: 'Join our loyalty program' },
      { day: 10, template: 'welcome_4', subject: 'Your first-time discount' },
    ];
    for (const step of steps) {
      const target = new Date(Date.now() - step.day * 86400000);
      const dayStart = new Date(target);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(target);
      dayEnd.setHours(23, 59, 59, 999);

      const users = await this.userRepo.find({
        where: { createdAt: Between(dayStart, dayEnd) },
      });
      for (const user of users) {
        const sent = await this.logRepo.findOne({
          where: { userId: user.id, campaignType: `welcome_${step.day}` },
        });
        if (sent) continue;
        await this.mail.sendTemplateEmail({
          to: user.email,
          template: step.template,
          subject: step.subject,
          data: { firstName: user.firstName },
        });
        await this.logRepo.save(
          this.logRepo.create({
            userId: user.id,
            campaignType: `welcome_${step.day}`,
            sentAt: new Date(),
            channel: 'email',
          }),
        );
      }
    }
  }

  // Win-Back - daily at 9 AM
  @Cron('0 9 * * *')
  async processWinBack() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const inactive = await this.userRepo
      .createQueryBuilder('user')
      .where('user.lastOrderDate < :date', { date: thirtyDaysAgo })
      .andWhere('user.emailOptIn = true')
      .getMany();

    for (const user of inactive) {
      const recent = await this.logRepo.findOne({
        where: {
          userId: user.id,
          campaignType: 'win_back',
          sentAt: MoreThan(sevenDaysAgo),
        },
      });
      if (recent) continue;
      await this.mail.sendWinBackEmail({
        to: user.email,
        firstName: user.firstName,
        couponCode: 'MISSYOU15',
        discountPercent: 15,
      });
      await this.logRepo.save(
        this.logRepo.create({
          userId: user.id,
          campaignType: 'win_back',
          sentAt: new Date(),
          channel: 'email',
        }),
      );
    }
  }
}
```

#### Marketing Automation Timeline

| Trigger        | Action                | Delay     | Channel      |
| -------------- | --------------------- | --------- | ------------ |
| New signup     | Welcome + 10% coupon  | Immediate | Email        |
| Day 2          | Product highlights    | 2 days    | Email        |
| Day 5          | Loyalty invite        | 5 days    | Email        |
| Cart abandoned | Recovery + COMEBACK10 | 1 hour    | Email + SMS  |
| No order 30d   | Win-back + MISSYOU15  | 30 days   | Email        |
| Item restocked | Restock alert         | Immediate | Email + Push |
| Tier upgrade   | Congrats + perks      | Immediate | Email        |

---

## 8. Monitoring & Observability

Production reliability requires health checks for orchestrators, structured JSON logging for aggregation, Sentry for error tracking with full context, and Prometheus-compatible metrics for dashboards and alerting.

### 8.1 Health Checks & Readiness

Health endpoints enable Kubernetes/ECS to verify service availability. Liveness confirms the process runs; readiness confirms all dependencies (database, Redis, disk) are connected.

> 🔧 **BACKEND** · `cannasaas-api/src/modules/health/health.controller.ts` + `redis.health.ts`

```typescript
// cannasaas-api/src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get('liveness')
  @HealthCheck()
  liveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
      () => this.redis.isHealthy('redis'),
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      () =>
        this.disk.checkStorage('disk', { thresholdPercent: 0.9, path: '/' }),
    ]);
  }
}

// cannasaas-api/src/modules/health/redis.health.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.cache.set('health_check', 'ok', 10);
      const val = await this.cache.get('health_check');
      if (val === 'ok') return this.getStatus(key, true);
      throw new Error('Redis read/write mismatch');
    } catch (e) {
      throw new HealthCheckError(
        'Redis failed',
        this.getStatus(key, false, { message: e.message }),
      );
    }
  }
}
```

---

### 8.2 Structured Logging

> 🔧 **BACKEND** · `cannasaas-api/src/common/logger/winston.config.ts` + `cannasaas-api/src/common/middleware/request-logger.middleware.ts`

Winston provides machine-parseable JSON output for CloudWatch, Datadog, or ELK. Each log entry includes request ID, organization context, duration, and user identity for full traceability.

```typescript
// cannasaas-api/src/common/logger/winston.config.ts
import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.forRoot({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : utilities.format.nestLike('CannaSaas', {
              prettyPrint: true,
              colors: true,
            }),
      ),
    }),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
            maxsize: 50 * 1024 * 1024,
            maxFiles: 10,
          }),
        ]
      : []),
  ],
});

// cannasaas-api/src/common/middleware/request-logger.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = nanoid(12);
    const start = Date.now();
    req['requestId'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    res.on('finish', () => {
      this.logger.log({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${Date.now() - start}ms`,
        orgId: req['organizationId'],
        userId: req['user']?.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    });
    next();
  }
}
```

---

### 8.3 Error Tracking with Sentry

> 🔧 **BACKEND** · `cannasaas-api/src/common/filters/sentry-exception.filter.ts` + `cannasaas-api/src/main.ts`

Sentry captures all unhandled 5xx errors with full stack traces, breadcrumbs, and release tracking. The global exception filter enriches events with organization, user, and request context.

```typescript
// cannasaas-api/src/common/filters/sentry-exception.filter.ts
import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('organizationId', request['organizationId']);
        scope.setTag('requestId', request['requestId']);
        scope.setUser({
          id: request['user']?.id,
          email: request['user']?.email,
        });
        scope.setExtra('url', request.originalUrl);
        scope.setExtra('method', request.method);
        scope.setExtra('body', request.body);
        Sentry.captureException(exception);
      });
    }
    super.catch(exception, host);
  }
}

// cannasaas-api/src/main.ts - Sentry initialization (add near top of bootstrap)
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION || '1.0.0',
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
});
```

---

### 8.4 Performance Metrics & Alerting

> 🔧 **BACKEND** · `cannasaas-api/src/common/metrics/metrics.service.ts` + `metrics.controller.ts` + `metrics.interceptor.ts`

Prometheus-compatible metrics expose request durations, active connections, and business KPIs.

```typescript
// cannasaas-api/src/common/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  public readonly registry = new Registry();

  public readonly httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
    registers: [this.registry],
  });

  public readonly httpTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  public readonly activeWs = new Gauge({
    name: 'active_websocket_connections',
    help: 'Active WebSocket connections',
    registers: [this.registry],
  });

  public readonly ordersProcessed = new Counter({
    name: 'orders_processed_total',
    help: 'Total orders processed',
    labelNames: ['organization_id', 'status'],
    registers: [this.registry],
  });

  public readonly revenue = new Counter({
    name: 'revenue_cents_total',
    help: 'Total revenue in cents',
    labelNames: ['organization_id'],
    registers: [this.registry],
  });

  public readonly dbQueryDuration = new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Database query durations',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
    registers: [this.registry],
  });
}

// cannasaas-api/src/common/metrics/metrics.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', this.metricsService.registry.contentType);
    res.end(await this.metricsService.registry.metrics());
  }
}

// cannasaas-api/src/common/interceptors/metrics.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metrics: MetricsService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const request = ctx.switchToHttp().getRequest();
    const route = request.route?.path || request.url;
    const method = request.method;
    const end = this.metrics.httpDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const status = ctx.switchToHttp().getResponse().statusCode;
          end({ status_code: String(status) });
          this.metrics.httpTotal.inc({
            method,
            route,
            status_code: String(status),
          });
        },
        error: () => {
          end({ status_code: '500' });
          this.metrics.httpTotal.inc({ method, route, status_code: '500' });
        },
      }),
    );
  }
}
```

#### Alerting Rules (Grafana/Prometheus)

| Alert        | Condition                   | Severity | Action            |
| ------------ | --------------------------- | -------- | ----------------- |
| High Latency | p95 > 2s for 5 min          | Warning  | Slack #ops        |
| Error Spike  | 5xx rate > 5% for 2 min     | Critical | PagerDuty + Slack |
| DB Slow      | Query p95 > 500ms for 5 min | Warning  | Slack #ops        |
| Memory High  | Heap > 80% for 10 min       | Warning  | Slack #ops        |
| Revenue Drop | Hourly rev < 50% avg        | Info     | Email to team     |
| Health Down  | Readiness fails 3x          | Critical | PagerDuty         |

---

## 9. Enhanced Commerce (Phase 2 - Weeks 17-20)

Phase 2 adds customer engagement features that drive repeat purchases and operational efficiency: a reviews and ratings system, a tiered loyalty program, a flexible promotions engine, and real-time inventory management with low-stock alerts.

### 9.1 Reviews & Ratings System

Verified-purchase reviews with moderation, aggregate rating calculation, and helpful vote tracking. Only customers who have completed an order for the product can leave a review.

#### Review Entity & Service

> 🔧 **BACKEND** · `cannasaas-api/src/modules/reviews/entities/review.entity.ts` + `cannasaas-api/src/modules/reviews/review.service.ts`

```typescript
// cannasaas-api/src/modules/reviews/entities/review.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('reviews')
@Index(['productId', 'status'])
@Index(['userId', 'productId'], { unique: true })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product)
  product: Product;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'int', default: 5 })
  rating: number; // 1-5

  @Column('text')
  title: string;

  @Column('text')
  body: string;

  @Column({ type: 'boolean', default: false })
  verifiedPurchase: boolean;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Column({ type: 'int', default: 0 })
  helpfulVotes: number;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// cannasaas-api/src/modules/reviews/review.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewStatus } from './entities/review.entity';
import { OrderService } from '../orders/order.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    private orderService: OrderService,
  ) {}

  async create(
    userId: string,
    dto: {
      productId: string;
      rating: number;
      title: string;
      body: string;
      images?: string[];
    },
  ) {
    const existing = await this.reviewRepo.findOne({
      where: { userId, productId: dto.productId },
    });
    if (existing)
      throw new BadRequestException('You already reviewed this product');

    const hasPurchased = await this.orderService.hasUserPurchasedProduct(
      userId,
      dto.productId,
    );

    const review = this.reviewRepo.create({
      ...dto,
      userId,
      verifiedPurchase: hasPurchased,
      status: ReviewStatus.PENDING,
    });
    return this.reviewRepo.save(review);
  }

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { productId, status: ReviewStatus.APPROVED },
      relations: ['user'],
      order: { helpfulVotes: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { reviews, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getAggregateRating(productId: string) {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'average')
      .addSelect('COUNT(r.id)', 'count')
      .addSelect('SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END)', 'five')
      .addSelect('SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END)', 'four')
      .addSelect('SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END)', 'three')
      .addSelect('SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END)', 'two')
      .addSelect('SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END)', 'one')
      .where('r.productId = :productId', { productId })
      .andWhere('r.status = :status', { status: ReviewStatus.APPROVED })
      .getRawOne();

    return {
      average: parseFloat(result.average) || 0,
      count: parseInt(result.count) || 0,
      distribution: {
        5: parseInt(result.five) || 0,
        4: parseInt(result.four) || 0,
        3: parseInt(result.three) || 0,
        2: parseInt(result.two) || 0,
        1: parseInt(result.one) || 0,
      },
    };
  }

  async voteHelpful(reviewId: string, userId: string) {
    await this.reviewRepo.increment({ id: reviewId }, 'helpfulVotes', 1);
  }

  async moderate(reviewId: string, status: ReviewStatus) {
    await this.reviewRepo.update(reviewId, { status });
  }
}
```

---

### 9.2 Loyalty Program

A tiered loyalty program awards points on purchases and allows redemption for discounts. Tiers (Bronze, Silver, Gold, Platinum) unlock progressively better earn rates and exclusive perks.

#### Loyalty Service

> 🔧 **BACKEND** · `cannasaas-api/src/modules/loyalty/loyalty.service.ts`

```typescript
// cannasaas-api/src/modules/loyalty/loyalty.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';

export enum LoyaltyTier {
  BRONZE = 'bronze', // 0-499 points
  SILVER = 'silver', // 500-1999 points
  GOLD = 'gold', // 2000-4999 points
  PLATINUM = 'platinum', // 5000+ points
}

const TIER_CONFIG = {
  [LoyaltyTier.BRONZE]: { min: 0, earnRate: 1.0, redeemRate: 100, perks: [] },
  [LoyaltyTier.SILVER]: {
    min: 500,
    earnRate: 1.25,
    redeemRate: 90,
    perks: ['Free shipping on orders > $50'],
  },
  [LoyaltyTier.GOLD]: {
    min: 2000,
    earnRate: 1.5,
    redeemRate: 80,
    perks: ['Free shipping', 'Early access to new products'],
  },
  [LoyaltyTier.PLATINUM]: {
    min: 5000,
    earnRate: 2.0,
    redeemRate: 70,
    perks: [
      'Free shipping',
      'Early access',
      'Exclusive deals',
      'Priority support',
    ],
  },
};

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    @InjectRepository(LoyaltyAccount)
    private accountRepo: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyTransaction)
    private txRepo: Repository<LoyaltyTransaction>,
  ) {}

  async getOrCreateAccount(userId: string, orgId: string) {
    let account = await this.accountRepo.findOne({
      where: { userId, organizationId: orgId },
    });
    if (!account) {
      account = this.accountRepo.create({
        userId,
        organizationId: orgId,
        balance: 0,
        lifetimePoints: 0,
        tier: LoyaltyTier.BRONZE,
      });
      await this.accountRepo.save(account);
    }
    return account;
  }

  async earnPoints(
    userId: string,
    orgId: string,
    orderId: string,
    amount: number,
  ) {
    const account = await this.getOrCreateAccount(userId, orgId);
    const config = TIER_CONFIG[account.tier];
    const points = Math.floor(amount * config.earnRate);

    account.balance += points;
    account.lifetimePoints += points;
    account.tier = this.calculateTier(account.lifetimePoints);
    await this.accountRepo.save(account);

    await this.txRepo.save(
      this.txRepo.create({
        accountId: account.id,
        type: 'earn',
        points,
        orderId,
        description: `Earned ${points} pts on order`,
      }),
    );

    return {
      pointsEarned: points,
      newBalance: account.balance,
      tier: account.tier,
    };
  }

  async redeemPoints(userId: string, orgId: string, points: number) {
    const account = await this.getOrCreateAccount(userId, orgId);
    if (account.balance < points) {
      throw new Error(
        `Insufficient points. Have ${account.balance}, need ${points}`,
      );
    }

    const config = TIER_CONFIG[account.tier];
    const discount = points / config.redeemRate;

    account.balance -= points;
    await this.accountRepo.save(account);

    await this.txRepo.save(
      this.txRepo.create({
        accountId: account.id,
        type: 'redeem',
        points: -points,
        description: `Redeemed ${points} pts for $${discount.toFixed(2)} off`,
      }),
    );

    return {
      pointsRedeemed: points,
      discountAmount: discount,
      remainingBalance: account.balance,
    };
  }

  private calculateTier(lifetime: number): LoyaltyTier {
    if (lifetime >= 5000) return LoyaltyTier.PLATINUM;
    if (lifetime >= 2000) return LoyaltyTier.GOLD;
    if (lifetime >= 500) return LoyaltyTier.SILVER;
    return LoyaltyTier.BRONZE;
  }
}
```

#### Loyalty Tier Summary

| Tier     | Points Required | Earn Rate     | Redemption   | Perks                               |
| -------- | --------------- | ------------- | ------------ | ----------------------------------- |
| Bronze   | 0               | 1x ($1 = 1pt) | 100 pts = $1 | Base tier                           |
| Silver   | 500 lifetime    | 1.25x         | 90 pts = $1  | Free shipping >$50                  |
| Gold     | 2,000 lifetime  | 1.5x          | 80 pts = $1  | + Early access                      |
| Platinum | 5,000 lifetime  | 2x            | 70 pts = $1  | + Exclusive deals, priority support |

---

### 9.3 Promotions Engine

> 🔧 **BACKEND** · `cannasaas-api/src/modules/promotions/entities/promotion.entity.ts` + `cannasaas-api/src/modules/promotions/promotion.service.ts`

A flexible promotion system supports percentage discounts, fixed amount off, buy-X-get-Y, and free shipping. Promotions can target specific products, categories, or minimum order values, with usage limits and expiration dates.

```typescript
// cannasaas-api/src/modules/promotions/entities/promotion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  BUY_X_GET_Y = 'buy_x_get_y',
  FREE_SHIPPING = 'free_shipping',
}

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  organizationId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: PromotionType })
  type: PromotionType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumOrderValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximumDiscount: number;

  @Column({ type: 'jsonb', nullable: true })
  conditions: {
    productIds?: string[];
    categoryIds?: string[];
    buyQuantity?: number;
    getQuantity?: number;
    firstTimeOnly?: boolean;
    minItems?: number;
  };

  @Column({ type: 'int', nullable: true })
  usageLimit: number;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'int', default: 1 })
  perCustomerLimit: number;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// cannasaas-api/src/modules/promotions/promotion.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion, PromotionType } from './entities/promotion.entity';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion) private promoRepo: Repository<Promotion>,
  ) {}

  async validate(
    code: string,
    orgId: string,
    cart: {
      total: number;
      items: {
        productId: string;
        categoryId: string;
        quantity: number;
        price: number;
      }[];
      userId: string;
    },
  ) {
    const promo = await this.promoRepo.findOne({
      where: { code: code.toUpperCase(), organizationId: orgId, active: true },
    });
    if (!promo) throw new BadRequestException('Invalid promo code');

    const now = new Date();
    if (now < promo.startsAt || now > promo.expiresAt)
      throw new BadRequestException('Promo code expired');
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit)
      throw new BadRequestException('Promo code usage limit reached');
    if (cart.total < Number(promo.minimumOrderValue))
      throw new BadRequestException(
        `Minimum order of $${promo.minimumOrderValue} required`,
      );

    return this.calculateDiscount(promo, cart);
  }

  private calculateDiscount(promo: Promotion, cart: any) {
    let discount = 0;
    switch (promo.type) {
      case PromotionType.PERCENTAGE:
        discount = cart.total * (Number(promo.value) / 100);
        if (promo.maximumDiscount)
          discount = Math.min(discount, Number(promo.maximumDiscount));
        break;
      case PromotionType.FIXED_AMOUNT:
        discount = Math.min(Number(promo.value), cart.total);
        break;
      case PromotionType.FREE_SHIPPING:
        discount = cart.shippingCost || 0;
        break;
      case PromotionType.BUY_X_GET_Y:
        const { buyQuantity = 2, getQuantity = 1 } = promo.conditions || {};
        const eligible = cart.items.filter(
          (i) =>
            !promo.conditions?.productIds?.length ||
            promo.conditions.productIds.includes(i.productId),
        );
        const totalQty = eligible.reduce((s, i) => s + i.quantity, 0);
        const sets = Math.floor(totalQty / (buyQuantity + getQuantity));
        const cheapest = eligible.sort((a, b) => a.price - b.price);
        discount = cheapest
          .slice(0, sets * getQuantity)
          .reduce((s, i) => s + i.price, 0);
        break;
    }
    return {
      promoId: promo.id,
      code: promo.code,
      type: promo.type,
      discount: Math.round(discount * 100) / 100,
      description: promo.name,
    };
  }
}
```

---

### 9.4 Inventory Management

> 🔧 **BACKEND** · `cannasaas-api/src/modules/inventory/inventory.service.ts`

Real-time inventory tracking with automatic low-stock alerts, stock reservation during checkout, and batch import/export. Supports multiple locations with per-location stock levels.

```typescript
// cannasaas-api/src/modules/inventory/inventory.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryItem) private invRepo: Repository<InventoryItem>,
    @InjectRepository(StockMovement)
    private movementRepo: Repository<StockMovement>,
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
  ) {}

  async adjustStock(dto: {
    productId: string;
    variantId?: string;
    locationId: string;
    quantity: number;
    reason: string;
    userId: string;
    type: 'receive' | 'sell' | 'adjust' | 'return' | 'damage';
  }) {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(InventoryItem, {
        where: {
          productId: dto.productId,
          variantId: dto.variantId,
          locationId: dto.locationId,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new BadRequestException('Inventory item not found');

      const previousQty = item.quantityOnHand;
      item.quantityOnHand += dto.quantity;
      if (item.quantityOnHand < 0)
        throw new BadRequestException('Insufficient stock');

      await manager.save(item);
      await manager.save(StockMovement, {
        inventoryItemId: item.id,
        type: dto.type,
        quantity: dto.quantity,
        previousQuantity: previousQty,
        newQuantity: item.quantityOnHand,
        reason: dto.reason,
        userId: dto.userId,
      });

      // Low stock alert
      if (
        item.quantityOnHand <= item.lowStockThreshold &&
        previousQty > item.lowStockThreshold
      ) {
        this.eventEmitter.emit('inventory.low_stock', {
          productId: dto.productId,
          current: item.quantityOnHand,
          threshold: item.lowStockThreshold,
        });
      }

      // Restock notification
      if (previousQty <= 0 && item.quantityOnHand > 0) {
        this.eventEmitter.emit('inventory.restocked', {
          productId: dto.productId,
          variantId: dto.variantId,
        });
      }

      return item;
    });
  }

  async reserveStock(
    items: {
      productId: string;
      variantId?: string;
      locationId: string;
      quantity: number;
    }[],
  ) {
    return this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        const inv = await manager.findOne(InventoryItem, {
          where: {
            productId: item.productId,
            variantId: item.variantId,
            locationId: item.locationId,
          },
          lock: { mode: 'pessimistic_write' },
        });
        if (!inv || inv.quantityOnHand - inv.quantityReserved < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.productId}`,
          );
        }
        inv.quantityReserved += item.quantity;
        await manager.save(inv);
      }
    });
  }
}
```

#### Stock Movement Types

| Type     | Direction | Trigger         | Example                      |
| -------- | --------- | --------------- | ---------------------------- |
| receive  | +         | Manual / PO     | New shipment from supplier   |
| sell     | -         | Order completed | Customer purchase            |
| adjust   | +/-       | Manual count    | Cycle count correction       |
| return   | +         | Customer return | Refund processed             |
| damage   | -         | Manual          | Product damaged in transit   |
| transfer | +/-       | Location move   | Move stock between locations |

---

## 10. Operations & Analytics (Phase 3 - Weeks 21-24)

Phase 3 focuses on operational excellence: delivery tracking with real-time status updates, an advanced analytics dashboard for dispensary owners, and WebSocket-based notifications for instant communication.

### 10.1 Delivery Tracking

> 🔧 **BACKEND** · `cannasaas-api/src/modules/delivery/delivery.service.ts`

Real-time delivery tracking with driver assignment, status progression, GPS coordinate updates, and estimated arrival times. Integrates with the WebSocket gateway for live customer updates.

```typescript
// cannasaas-api/src/modules/delivery/delivery.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';
import { NotificationGateway } from '../notifications/notification.gateway';

const STATUS_FLOW: DeliveryStatus[] = [
  DeliveryStatus.PENDING,
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.ARRIVING,
  DeliveryStatus.DELIVERED,
];

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(Delivery) private deliveryRepo: Repository<Delivery>,
    private notifications: NotificationGateway,
  ) {}

  async assignDriver(deliveryId: string, driverId: string, driverName: string) {
    const delivery = await this.deliveryRepo.findOneOrFail({
      where: { id: deliveryId },
    });
    delivery.driverId = driverId;
    delivery.driverName = driverName;
    delivery.status = DeliveryStatus.ASSIGNED;
    delivery.assignedAt = new Date();
    await this.deliveryRepo.save(delivery);

    this.notifications.sendToOrder(delivery.orderId, 'delivery:assigned', {
      driverName,
      estimatedMinutes: delivery.estimatedMinutes,
    });
    return delivery;
  }

  async updateStatus(deliveryId: string, status: DeliveryStatus) {
    const delivery = await this.deliveryRepo.findOneOrFail({
      where: { id: deliveryId },
    });

    const currentIdx = STATUS_FLOW.indexOf(delivery.status);
    const newIdx = STATUS_FLOW.indexOf(status);
    if (newIdx <= currentIdx)
      throw new Error(`Cannot transition from ${delivery.status} to ${status}`);

    delivery.status = status;
    if (status === DeliveryStatus.PICKED_UP) delivery.pickedUpAt = new Date();
    if (status === DeliveryStatus.DELIVERED) delivery.deliveredAt = new Date();

    await this.deliveryRepo.save(delivery);
    this.notifications.sendToOrder(delivery.orderId, 'delivery:status', {
      status,
      timestamp: new Date(),
    });
    return delivery;
  }

  async updateLocation(deliveryId: string, lat: number, lng: number) {
    const delivery = await this.deliveryRepo.findOneOrFail({
      where: { id: deliveryId },
    });
    delivery.currentLat = lat;
    delivery.currentLng = lng;

    const distance = this.haversineDistance(
      lat,
      lng,
      delivery.lat,
      delivery.lng,
    );
    delivery.estimatedMinutes = Math.max(2, Math.round(distance / 0.5));

    await this.deliveryRepo.save(delivery);
    this.notifications.sendToOrder(delivery.orderId, 'delivery:location', {
      lat,
      lng,
      estimatedMinutes: delivery.estimatedMinutes,
    });
  }

  private haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
```

---

### 10.2 Advanced Analytics Dashboard

> 🔧 **BACKEND** · `cannasaas-api/src/modules/analytics/advanced-analytics.service.ts`

A comprehensive analytics API providing revenue trends, customer cohort analysis, product performance, and conversion funnels.

```typescript
// cannasaas-api/src/modules/analytics/advanced-analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';

@Injectable()
export class AdvancedAnalyticsService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(AnalyticsEvent)
    private eventRepo: Repository<AnalyticsEvent>,
  ) {}

  async getRevenueTrends(orgId: string, days: number = 30) {
    return this.orderRepo.query(
      `
      SELECT DATE(created_at) as date, COUNT(*) as order_count,
        SUM(total) as revenue, AVG(total) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM orders
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
        AND status NOT IN ('cancelled', 'refunded')
      GROUP BY DATE(created_at) ORDER BY date ASC
    `,
      [orgId],
    );
  }

  async getCohortAnalysis(orgId: string) {
    return this.orderRepo.query(
      `
      WITH first_orders AS (
        SELECT customer_id, DATE_TRUNC('month', MIN(created_at)) as cohort
        FROM orders WHERE organization_id = $1 GROUP BY customer_id
      ),
      monthly_activity AS (
        SELECT fo.cohort, DATE_TRUNC('month', o.created_at) as activity_month,
          COUNT(DISTINCT o.customer_id) as active_customers
        FROM orders o JOIN first_orders fo ON o.customer_id = fo.customer_id
        WHERE o.organization_id = $1
        GROUP BY fo.cohort, DATE_TRUNC('month', o.created_at)
      )
      SELECT cohort, activity_month, active_customers,
        EXTRACT(MONTH FROM activity_month - cohort) as months_since
      FROM monthly_activity ORDER BY cohort, activity_month
    `,
      [orgId],
    );
  }

  async getConversionFunnel(orgId: string, days: number = 7) {
    const events = await this.eventRepo.query(
      `
      SELECT event_type, COUNT(DISTINCT session_id) as unique_sessions
      FROM analytics_events
      WHERE organization_id = $1
        AND timestamp >= NOW() - INTERVAL '${days} days'
        AND event_type IN ('page_view','product_view','add_to_cart',
          'begin_checkout','purchase')
      GROUP BY event_type
    `,
      [orgId],
    );

    const funnel = [
      'page_view',
      'product_view',
      'add_to_cart',
      'begin_checkout',
      'purchase',
    ];
    return funnel.map((step) => {
      const data = events.find((e: any) => e.event_type === step);
      return { step, sessions: parseInt(data?.unique_sessions || '0') };
    });
  }
}
```

---

### 10.3 Real-Time Notifications (WebSocket)

A WebSocket gateway using Socket.IO provides real-time notifications for order updates, delivery tracking, inventory alerts, and admin notifications. Rooms are organized by organization and order ID.

#### Notification Gateway

> 🔧 **BACKEND** · `cannasaas-api/src/modules/notifications/notification.gateway.ts`

```typescript
// cannasaas-api/src/modules/notifications/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
  namespace: '/ws',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwt.verify(token);
      client.data.userId = payload.sub;
      client.data.orgId = payload.organizationId;

      client.join(`org:${payload.organizationId}`);
      client.join(`user:${payload.sub}`);
      if (['admin', 'manager', 'staff'].includes(payload.role)) {
        client.join(`admin:${payload.organizationId}`);
      }
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.data?.userId}`);
  }

  @SubscribeMessage('subscribe:order')
  handleOrderSubscribe(client: Socket, orderId: string) {
    client.join(`order:${orderId}`);
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToOrg(orgId: string, event: string, data: any) {
    this.server.to(`org:${orgId}`).emit(event, data);
  }

  sendToOrder(orderId: string, event: string, data: any) {
    this.server.to(`order:${orderId}`).emit(event, data);
  }

  sendToAdmin(orgId: string, event: string, data: any) {
    this.server.to(`admin:${orgId}`).emit(event, data);
  }
}
```

#### useSocket React Hook

> 📦 **SHARED** · `cannasaas-storefront/src/hooks/useSocket.ts` _(also used in `cannasaas-admin/src/hooks/useSocket.ts`)_
>
> Used in both the admin panel (for order/inventory alerts) and the storefront (for delivery tracking updates).

```typescript
// cannasaas-storefront/src/hooks/useSocket.ts  (identical copy in cannasaas-admin)
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';

export function useSocket() {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;
    const socket = io(`${import.meta.env.VITE_API_URL}/ws`, {
      auth: { token },
      transports: ['websocket'],
    });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [token]);

  const subscribe = (event: string, handler: (data: any) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  };

  return { connected, subscribe };
}
```

---

## 11. AI Integration (Phase 4 - Weeks 25-28)

Phase 4 introduces AI-powered features that differentiate CannaSaas: automated product description generation, an intelligent customer-facing chatbot, and demand forecasting for inventory optimization.

### 11.1 AI Product Descriptions

> 🔧 **BACKEND** · `cannasaas-api/src/modules/ai/ai-description.service.ts`

Generates SEO-optimized, compliance-aware product descriptions using Claude. Supports bulk generation, tone customization, and automatic cannabis-specific terminology inclusion.

```typescript
// cannasaas-api/src/modules/ai/ai-description.service.ts
import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class AiDescriptionService {
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateDescription(
    productId: string,
    options?: {
      tone?: 'professional' | 'casual' | 'medical' | 'luxury';
      maxLength?: number;
    },
  ) {
    const product = await this.productRepo.findOneOrFail({
      where: { id: productId },
      relations: ['category'],
    });

    const prompt = `Generate a product description for a cannabis dispensary.

Product: ${product.name}
Category: ${product.category?.name || 'General'}
Strain Type: ${product.strainType || 'N/A'}
THC: ${product.thcContent || 'N/A'}%
CBD: ${product.cbdContent || 'N/A'}%
Terpenes: ${product.terpenes?.join(', ') || 'N/A'}
Brand: ${product.brand || 'N/A'}

Requirements:
- Tone: ${options?.tone || 'professional'}
- Maximum ${options?.maxLength || 300} words
- SEO-friendly with natural keyword inclusion
- Do NOT make medical claims
- Focus on flavor profile, aroma, and experience`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const description =
      response.content[0].type === 'text' ? response.content[0].text : '';

    product.aiDescription = description;
    product.aiDescriptionGeneratedAt = new Date();
    await this.productRepo.save(product);

    return { productId, description };
  }

  async bulkGenerate(orgId: string, productIds: string[], tone?: string) {
    const results = [];
    for (const id of productIds) {
      try {
        const result = await this.generateDescription(id, {
          tone: tone as any,
        });
        results.push({ ...result, success: true });
      } catch (error) {
        results.push({ productId: id, success: false, error: error.message });
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Rate limit
    }
    return results;
  }
}
```

---

### 11.2 AI Customer Chatbot

> 🔧 **BACKEND** · `cannasaas-api/src/modules/ai/chatbot.service.ts`

An intelligent chatbot that answers product questions, recommends items based on preferences, and checks order status. Uses RAG (Retrieval-Augmented Generation) with the dispensary product catalog.

```typescript
// cannasaas-api/src/modules/ai/chatbot.service.ts
import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ChatbotService {
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async chat(
    orgId: string,
    userId: string | null,
    message: string,
    history: ChatMessage[] = [],
  ) {
    const context = await this.buildContext(orgId, message, userId);

    const systemPrompt = `You are a helpful cannabis dispensary assistant.
Rules:
- NEVER make medical claims or prescribe cannabis for conditions
- Always recommend consulting a budtender for personalized advice
- Keep responses concise (under 200 words)
- Recommend products from the catalog when relevant

Current catalog context:
${context}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        ...history.map((m) => ({ role: m.role as any, content: m.content })),
        { role: 'user', content: message },
      ],
    });

    return {
      reply:
        response.content[0].type === 'text' ? response.content[0].text : '',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  private async buildContext(
    orgId: string,
    query: string,
    userId: string | null,
  ): Promise<string> {
    const parts: string[] = [];
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (keywords.length > 0) {
      const products = await this.productRepo.find({
        where: keywords
          .map((k) => [
            { organizationId: orgId, name: ILike(`%${k}%`), active: true },
          ])
          .flat(),
        take: 5,
      });
      if (products.length > 0) {
        parts.push('Matching Products:');
        products.forEach((p) => {
          parts.push(
            `- ${p.name} ($${p.price})` +
              (p.strainType ? ` | ${p.strainType}` : '') +
              (p.thcContent ? ` | THC: ${p.thcContent}%` : ''),
          );
        });
      }
    }

    if (userId && /order|status|track|deliver/i.test(query)) {
      const recent = await this.orderRepo.find({
        where: { customerId: userId, organizationId: orgId },
        order: { createdAt: 'DESC' },
        take: 3,
      });
      if (recent.length > 0) {
        parts.push('\nRecent Orders:');
        recent.forEach((o) =>
          parts.push(`- #${o.orderNumber}: ${o.status} ($${o.total})`),
        );
      }
    }

    return parts.join('\n') || 'No specific products match.';
  }
}
```

---

### 11.3 Demand Forecasting

> 🔧 **BACKEND** · `cannasaas-api/src/modules/ai/forecast.service.ts`

Uses historical sales data to predict future demand per product, helping dispensary owners optimize inventory levels and prevent stockouts.

````typescript
// cannasaas-api/src/modules/ai/forecast.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ForecastService {
  private readonly anthropic: Anthropic;

  constructor(@InjectRepository(Order) private orderRepo: Repository<Order>) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async forecastDemand(orgId: string, productId: string, daysAhead = 30) {
    const salesData = await this.orderRepo.query(
      `
      SELECT DATE(o.created_at) as date, SUM(oi.quantity) as units_sold
      FROM order_items oi JOIN orders o ON oi.order_id = o.id
      WHERE o.organization_id = $1 AND oi.product_id = $2
        AND o.created_at >= NOW() - INTERVAL '90 days'
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY DATE(o.created_at) ORDER BY date ASC
    `,
      [orgId, productId],
    );

    const units = salesData.map((d: any) => parseInt(d.units_sold));
    const avgDaily =
      units.reduce((s: number, v: number) => s + v, 0) /
      Math.max(units.length, 1);
    const stdDev = Math.sqrt(
      units.reduce((s: number, v: number) => s + (v - avgDaily) ** 2, 0) /
        Math.max(units.length, 1),
    );

    const prompt = `Analyze sales data and forecast demand:
Daily sales (last 30 days): ${JSON.stringify(salesData.slice(-30))}
Avg daily: ${avgDaily.toFixed(1)}, Std dev: ${stdDev.toFixed(1)}

Forecast ${daysAhead} days. Return JSON only:
{ "predictedDailyAvg": number, "trend": "increasing"|"stable"|"decreasing",
  "recommendedReorderPoint": number, "recommendedSafetyStock": number }`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const aiText =
      response.content[0].type === 'text' ? response.content[0].text : '{}';
    let forecast;
    try {
      forecast = JSON.parse(aiText.replace(/```json?|\n?```/g, '').trim());
    } catch {
      forecast = {
        predictedDailyAvg: avgDaily,
        trend: 'stable',
        recommendedReorderPoint: Math.ceil(avgDaily * 7),
        recommendedSafetyStock: Math.ceil(stdDev * 2),
      };
    }

    return {
      productId,
      historicalAvg: avgDaily,
      historicalStdDev: stdDev,
      forecast: {
        ...forecast,
        forecastDays: daysAhead,
        totalPredicted: Math.ceil(forecast.predictedDailyAvg * daysAhead),
      },
    };
  }
}
````

---

## 12. Growth & Subscriptions (Phase 5 - Weeks 29-32)

Phase 5 expands the platform with recurring subscription billing, Progressive Web App support for mobile users, and a public REST API for third-party integrations.

### 12.1 Subscription & Billing (Stripe)

> 🔧 **BACKEND** · `cannasaas-api/src/modules/billing/billing.service.ts`

Stripe-based subscription management for the SaaS billing layer. Handles plan upgrades/downgrades, webhooks for payment events, and Stripe Customer Portal integration.

```typescript
// cannasaas-api/src/modules/billing/billing.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Organization } from '../organizations/organization.entity';

const PLAN_PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  professional: process.env.STRIPE_PRO_PRICE_ID,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
};

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async createSubscription(orgId: string, plan: string) {
    const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });

    if (!org.stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: org.contactEmail,
        name: org.legalName,
        metadata: { organizationId: orgId },
      });
      org.stripeCustomerId = customer.id;
      await this.orgRepo.save(org);
    }

    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId) throw new BadRequestException(`Invalid plan: ${plan}`);

    const subscription = await this.stripe.subscriptions.create({
      customer: org.stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { organizationId: orgId, plan },
      trial_period_days: plan === 'starter' ? 14 : undefined,
    });

    org.stripeSubscriptionId = subscription.id;
    org.plan = plan as any;
    await this.orgRepo.save(org);

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const pi = invoice.payment_intent as Stripe.PaymentIntent;
    return { subscriptionId: subscription.id, clientSecret: pi?.client_secret };
  }

  async changePlan(orgId: string, newPlan: string) {
    const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });
    if (!org.stripeSubscriptionId)
      throw new BadRequestException('No active subscription');

    const subscription = await this.stripe.subscriptions.retrieve(
      org.stripeSubscriptionId,
    );
    await this.stripe.subscriptions.update(org.stripeSubscriptionId, {
      items: [
        { id: subscription.items.data[0].id, price: PLAN_PRICE_IDS[newPlan] },
      ],
      proration_behavior: 'always_invoice',
    });
    org.plan = newPlan as any;
    await this.orgRepo.save(org);
  }

  async createPortalSession(orgId: string, returnUrl: string) {
    const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });
    const session = await this.stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await this.orgRepo.update(
          { id: sub.metadata.organizationId },
          { subscriptionStatus: sub.status, plan: sub.metadata.plan as any },
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.orgRepo.update(
          { id: sub.metadata.organizationId },
          { subscriptionStatus: 'canceled', plan: 'starter' as any },
        );
        break;
      }
      case 'invoice.payment_failed': {
        // Send dunning email
        break;
      }
    }
  }
}
```

#### Pricing Tiers

| Plan         | Monthly | Annual    | Locations | Key Features                                  |
| ------------ | ------- | --------- | --------- | --------------------------------------------- |
| Starter      | $49/mo  | $470/yr   | 1         | Basic store, 500 products, email support      |
| Professional | $149/mo | $1,430/yr | 5         | + Loyalty, AI, analytics, API, 5K products    |
| Enterprise   | $399/mo | $3,830/yr | Unlimited | + METRC, white-label, custom domain, priority |

---

### 12.2 Progressive Web App (PWA)

> ⚙️ **CONFIG** · `cannasaas-storefront/public/manifest.json`
> 🛒 **STOREFRONT** · `cannasaas-storefront/src/service-worker.ts`

PWA configuration enables mobile customers to install the storefront with offline support, push notifications, and fast loading through service worker caching.

```json
// cannasaas-storefront/public/manifest.json
{
  "name": "CannaSaas Store",
  "short_name": "CannaSaas",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1B5E20",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

```typescript
// cannasaas-storefront/src/service-worker.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkFirst,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache product/category API responses (stale-while-revalidate, 5 min)
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/v1/products') ||
    url.pathname.startsWith('/api/v1/categories'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 300 })],
  }),
);

// Cache images aggressively (cache-first, 7 days)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 604800 })],
  }),
);

// Network-first for cart and auth (always fresh)
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/v1/cart') ||
    url.pathname.startsWith('/api/v1/auth'),
  new NetworkFirst({ cacheName: 'auth-cache' }),
);
```

---

### 12.3 Public REST API & API Keys

> 🔧 **BACKEND** · `cannasaas-api/src/modules/api-keys/api-key.service.ts` + `cannasaas-api/src/common/guards/api-key.guard.ts`

A rate-limited public API enables third-party integrations (POS systems, delivery platforms). API keys are scoped to organizations with configurable permissions.

```typescript
// cannasaas-api/src/modules/api-keys/api-key.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(@InjectRepository(ApiKey) private keyRepo: Repository<ApiKey>) {}

  async createKey(orgId: string, name: string, permissions: string[]) {
    const rawKey = `cs_${randomBytes(32).toString('hex')}`;
    const hashedKey = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = this.keyRepo.create({
      organizationId: orgId,
      name,
      hashedKey,
      permissions,
      prefix: rawKey.slice(0, 10),
    });
    await this.keyRepo.save(apiKey);
    return { key: rawKey, id: apiKey.id, name, permissions };
  }

  async validateKey(rawKey: string) {
    const hashedKey = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.keyRepo.findOne({
      where: { hashedKey, active: true },
    });
    if (!apiKey) throw new UnauthorizedException('Invalid API key');
    if (apiKey.expiresAt && apiKey.expiresAt < new Date())
      throw new UnauthorizedException('API key expired');

    apiKey.lastUsedAt = new Date();
    apiKey.requestCount++;
    await this.keyRepo.save(apiKey);
    return apiKey;
  }

  async revokeKey(keyId: string, orgId: string) {
    await this.keyRepo.update(
      { id: keyId, organizationId: orgId },
      { active: false, revokedAt: new Date() },
    );
  }
}

// cannasaas-api/src/common/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ApiKeyService } from '../../modules/api-keys/api-key.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apiKeyService: ApiKeyService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer cs_')) return false;

    const rawKey = authHeader.replace('Bearer ', '');
    const apiKey = await this.apiKeyService.validateKey(rawKey);

    const requiredPermission = this.reflector.get<string>(
      'api_permission',
      context.getHandler(),
    );
    if (requiredPermission && !apiKey.permissions.includes(requiredPermission))
      return false;

    request['organizationId'] = apiKey.organizationId;
    request['apiKey'] = apiKey;
    return true;
  }
}
```

#### Public API Endpoints

| Endpoint                  | Method | Permission      | Description                |
| ------------------------- | ------ | --------------- | -------------------------- |
| /api/v1/products          | GET    | products:read   | List products with filters |
| /api/v1/products/:id      | GET    | products:read   | Get product details        |
| /api/v1/orders            | GET    | orders:read     | List orders                |
| /api/v1/orders            | POST   | orders:write    | Create order               |
| /api/v1/inventory         | GET    | inventory:read  | Get stock levels           |
| /api/v1/inventory/adjust  | POST   | inventory:write | Adjust stock               |
| /api/v1/customers         | GET    | customers:read  | List customers             |
| /api/v1/analytics/summary | GET    | analytics:read  | Get summary metrics        |

---

## 13. Enterprise & Compliance (Phase 6 - Weeks 33-36)

Phase 6 delivers enterprise-grade compliance features critical for cannabis businesses: METRC state tracking integration, robust age verification, purchase limit enforcement, and a comprehensive audit trail.

### 13.1 METRC Integration

> 🔧 **BACKEND** · `cannasaas-api/src/modules/compliance/metrc/metrc.service.ts`

METRC (Marijuana Enforcement Tracking Reporting and Compliance) is the state-mandated seed-to-sale tracking system. This integration synchronizes sales, inventory adjustments, and transfers.

```typescript
// cannasaas-api/src/modules/compliance/metrc/metrc.service.ts
import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class MetrcService {
  private readonly client: AxiosInstance;
  private readonly license: string;

  constructor(private config: ConfigService) {
    const vendorKey = this.config.get('METRC_VENDOR_KEY');
    const userKey = this.config.get('METRC_USER_KEY');
    this.license = this.config.get('METRC_LICENSE_NUMBER');

    this.client = axios.create({
      baseURL: this.config.get('METRC_BASE_URL'),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${vendorKey}:${userKey}`).toString('base64')}`,
      },
      timeout: 30000,
    });
  }

  async reportSale(sale: {
    salesDate: string;
    salesCustomerType: string;
    transactions: Array<{
      packageLabel: string;
      quantity: number;
      unitOfMeasure: string;
      totalAmount: number;
    }>;
  }) {
    try {
      await this.client.post(
        `/sales/v2/receipts?licenseNumber=${this.license}`,
        [sale],
      );
    } catch (error) {
      throw new HttpException('METRC sync failed', 502);
    }
  }

  async getActivePackages(): Promise<any[]> {
    const response = await this.client.get(
      `/packages/v2/active?licenseNumber=${this.license}`,
    );
    return response.data;
  }

  async adjustPackage(
    label: string,
    quantity: number,
    reason: string,
    adjustDate: string,
  ) {
    await this.client.post(
      `/packages/v2/adjust?licenseNumber=${this.license}`,
      [
        {
          Label: label,
          Quantity: quantity,
          UnitOfMeasure: 'Grams',
          AdjustmentReason: reason,
          AdjustmentDate: adjustDate,
        },
      ],
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get(`/facilities/v2?licenseNumber=${this.license}`);
      return true;
    } catch {
      return false;
    }
  }
}
```

---

### 13.2 Age Verification & Purchase Limits

> 🔧 **BACKEND** · `cannasaas-api/src/modules/compliance/guards/compliance.guard.ts`
>
> Applied as a guard on checkout endpoints. Enforces age verification and daily purchase weight limits at the API level.

```typescript
// cannasaas-api/src/modules/compliance/guards/compliance.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Organization } from '../../organizations/organization.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ComplianceGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const orgId = request.user?.organizationId;

    const [org, user] = await Promise.all([
      this.orgRepo.findOneOrFail({ where: { id: orgId } }),
      this.userRepo.findOneOrFail({ where: { id: userId } }),
    ]);

    // Age verification
    if (org.complianceConfig?.ageVerificationRequired) {
      if (!user.dateOfBirth)
        throw new ForbiddenException('Date of birth required');

      const age = this.calculateAge(user.dateOfBirth);
      const minAge = org.complianceConfig.medicalOnly ? 18 : 21;
      if (age < minAge)
        throw new ForbiddenException(`Must be ${minAge}+ to purchase`);

      if (org.complianceConfig.requireIdScan && user.idVerifiedAt) {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
        if (user.idVerifiedAt < ninetyDaysAgo)
          throw new ForbiddenException('ID verification expired');
      }
    }

    // Daily purchase limit
    if (org.complianceConfig?.dailyPurchaseLimit) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysOrders = await this.orderRepo.find({
        where: {
          customerId: userId,
          organizationId: orgId,
          createdAt: MoreThan(today),
          status: 'completed',
        },
      });
      const todaysTotal = todaysOrders.reduce(
        (s, o) => s + Number(o.totalWeight || 0),
        0,
      );

      if (todaysTotal >= org.complianceConfig.dailyPurchaseLimit)
        throw new ForbiddenException(
          `Daily limit (${org.complianceConfig.dailyPurchaseLimit}g) reached`,
        );
    }

    return true;
  }

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }
}
```

---

### 13.3 Audit Trail System

> 🔧 **BACKEND** · `cannasaas-api/src/modules/compliance/audit/audit.service.ts` + `cannasaas-api/src/common/interceptors/audit.interceptor.ts`

A comprehensive, tamper-resistant audit trail logs every significant action for regulatory compliance. The interceptor auto-logs all mutations; the service provides query and export capabilities.

```typescript
// cannasaas-api/src/modules/compliance/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS = 'access',
  EXPORT = 'export',
  COMPLIANCE_CHECK = 'compliance_check',
  INVENTORY_ADJUST = 'inventory_adjust',
  METRC_SYNC = 'metrc_sync',
  REFUND = 'refund',
  VOID = 'void',
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async log(entry: {
    organizationId: string;
    userId: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    severity: AuditSeverity;
    details: Record<string, any>;
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    ipAddress?: string;
  }) {
    const crypto = require('crypto');
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ ...entry, timestamp: new Date().toISOString() }))
      .digest('hex');

    return this.auditRepo.save(
      this.auditRepo.create({
        ...entry,
        timestamp: new Date(),
        hash,
      }),
    );
  }

  async getAuditTrail(
    orgId: string,
    filters: {
      resource?: string;
      userId?: string;
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const qb = this.auditRepo
      .createQueryBuilder('audit')
      .where('audit.organizationId = :orgId', { orgId })
      .orderBy('audit.timestamp', 'DESC');

    if (filters.resource)
      qb.andWhere('audit.resource = :r', { r: filters.resource });
    if (filters.userId) qb.andWhere('audit.userId = :u', { u: filters.userId });
    if (filters.action) qb.andWhere('audit.action = :a', { a: filters.action });
    if (filters.startDate)
      qb.andWhere('audit.timestamp >= :s', { s: filters.startDate });
    if (filters.endDate)
      qb.andWhere('audit.timestamp <= :e', { e: filters.endDate });

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const [logs, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }

  async exportForRegulator(orgId: string, startDate: Date, endDate: Date) {
    const logs = await this.auditRepo.find({
      where: { organizationId: orgId, timestamp: Between(startDate, endDate) },
      order: { timestamp: 'ASC' },
    });

    const headers =
      'Timestamp,User,Action,Resource,ResourceID,Severity,Details\n';
    const rows = logs
      .map(
        (l) =>
          `${l.timestamp.toISOString()},${l.userId},${l.action},${l.resource},${l.resourceId || ''},${l.severity},"${JSON.stringify(l.details).replace(/"/g, '""')}"`,
      )
      .join('\n');
    return headers + rows;
  }
}

// cannasaas-api/src/common/interceptors/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import {
  AuditService,
  AuditAction,
  AuditSeverity,
} from '../../modules/compliance/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private audit: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const request = ctx.switchToHttp().getRequest();
    const method = request.method;

    let action = AuditAction.ACCESS;
    if (method === 'POST') action = AuditAction.CREATE;
    if (method === 'PUT' || method === 'PATCH') action = AuditAction.UPDATE;
    if (method === 'DELETE') action = AuditAction.DELETE;

    return next.handle().pipe(
      tap(() => {
        this.audit.log({
          organizationId: request['organizationId'],
          userId: request.user?.id || 'anonymous',
          action,
          resource: ctx.getClass().name.replace('Controller', '').toLowerCase(),
          resourceId: request.params.id,
          severity:
            method === 'DELETE' ? AuditSeverity.HIGH : AuditSeverity.LOW,
          details: {
            method,
            url: request.originalUrl,
            body: method !== 'GET' ? request.body : undefined,
          },
          ipAddress: request.ip,
        });
      }),
    );
  }
}
```

---

## Appendices

### A.1 Environment Variable Reference

| Variable                   | Required | Default     | Description                       |
| -------------------------- | -------- | ----------- | --------------------------------- |
| DATABASE_URL               | Yes      | -           | PostgreSQL connection string      |
| REDIS_URL                  | Yes      | -           | Redis connection string           |
| JWT_SECRET                 | Yes      | -           | JWT signing secret (min 32 chars) |
| JWT_EXPIRY                 | No       | 24h         | Token expiration time             |
| STRIPE_SECRET_KEY          | Yes      | -           | Stripe API secret key             |
| STRIPE_WEBHOOK_SECRET      | Yes      | -           | Stripe webhook signing secret     |
| STRIPE_STARTER_PRICE_ID    | Yes      | -           | Starter plan Stripe Price ID      |
| STRIPE_PRO_PRICE_ID        | Yes      | -           | Professional plan Price ID        |
| STRIPE_ENTERPRISE_PRICE_ID | Yes      | -           | Enterprise plan Price ID          |
| ANTHROPIC_API_KEY          | Yes\*    | -           | Claude API key (for AI features)  |
| SENTRY_DSN                 | No       | -           | Sentry error tracking DSN         |
| METRC_BASE_URL             | No       | -           | METRC API base URL                |
| METRC_VENDOR_KEY           | No       | -           | METRC vendor API key              |
| METRC_USER_KEY             | No       | -           | METRC user API key                |
| METRC_LICENSE_NUMBER       | No       | -           | State cannabis license number     |
| AWS_S3_BUCKET              | Yes      | -           | S3 bucket for file uploads        |
| AWS_REGION                 | Yes      | us-east-1   | AWS region                        |
| FRONTEND_URL               | Yes      | -           | Frontend URL (CORS)               |
| NODE_ENV                   | No       | development | Environment name                  |
| PORT                       | No       | 3000        | Server port                       |

---

### A.2 Success Metrics

| Phase   | Metric                 | Target               | How Measured                  |
| ------- | ---------------------- | -------------------- | ----------------------------- |
| MVP     | Beta dispensaries      | 3-5 live             | Active orgs with orders       |
| MVP     | Page load time         | < 2 seconds          | Lighthouse, real user metrics |
| MVP     | Uptime                 | 99.5%                | Health check monitoring       |
| Phase 2 | Review submission rate | > 5% of orders       | Analytics events              |
| Phase 2 | Loyalty enrollment     | > 30% of customers   | Account creation rate         |
| Phase 3 | Delivery success rate  | > 95%                | Delivery status tracking      |
| Phase 3 | API response p95       | < 200ms              | Prometheus metrics            |
| Phase 4 | AI description usage   | > 50% of products    | Generation logs               |
| Phase 4 | Chatbot satisfaction   | > 4/5 rating         | Post-chat survey              |
| Phase 5 | MRR growth             | 20% month-over-month | Stripe dashboard              |
| Phase 5 | API adoption           | > 20% of Pro+ plans  | API key creation              |
| Phase 6 | METRC sync success     | > 99%                | Sync job logs                 |
| Phase 6 | Audit completeness     | 100% of mutations    | Audit log coverage            |

---

### A.3 Risk Mitigation Matrix

| Risk                        | Impact   | Probability | Mitigation                                          |
| --------------------------- | -------- | ----------- | --------------------------------------------------- |
| METRC API downtime          | High     | Medium      | Queue & retry with dead letter, manual override     |
| Stripe payment failures     | High     | Low         | Retry logic, dunning emails, cash fallback          |
| Cannabis regulation changes | High     | Medium      | Feature flags, modular compliance, legal review     |
| Data breach                 | Critical | Low         | Encryption at rest/transit, SOC 2, pen testing      |
| Scaling bottleneck          | Medium   | Medium      | Load testing, horizontal scaling, CDN               |
| AI API cost overruns        | Medium   | Medium      | Token budgets, caching, usage metering              |
| Key employee departure      | Medium   | Medium      | Documentation, code reviews, pair programming       |
| Competitor undercut         | Medium   | High        | Feature velocity, dispensary relationships, support |

---

### A.4 Glossary

| Term              | Definition                                                                          |
| ----------------- | ----------------------------------------------------------------------------------- |
| METRC             | Marijuana Enforcement Tracking Reporting & Compliance - state seed-to-sale tracking |
| Multi-tenant      | Single application instance serving multiple organizations with data isolation      |
| Feature Flag      | Runtime toggle controlling feature availability per organization/plan               |
| PWA               | Progressive Web App - installable web app with offline support                      |
| RBAC              | Role-Based Access Control - permissions mapped to user roles                        |
| Connected Account | Stripe sub-account for marketplace payment splitting                                |
| Slug              | URL-friendly identifier (e.g., green-leaf-dispensary)                               |
| HyperLogLog       | Redis probabilistic data structure for unique count estimation                      |
| Cohort Analysis   | Grouping users by acquisition date to track retention over time                     |
| Dead Letter Queue | Storage for failed async messages that exceeded retry limits                        |
| Dunning           | Process of communicating with customers about failed payments                       |
| RAG               | Retrieval-Augmented Generation - grounding AI responses in source data              |
| Haversine         | Formula for calculating distances between GPS coordinates on a sphere               |

---

_End of Implementation Guide v2.1_

_CannaSaas - Multi-Tenant Cannabis E-Commerce Platform_
