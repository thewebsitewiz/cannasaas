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

  constructor(@InjectRepository(Organization) private orgRepo: Repository<Organization>) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    });
  }

  async createSubscription(orgId: string, plan: string) {
    const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });

    if (!org.stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: org.contactEmail, name: org.legalName,
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
    const pi = (invoice as any).payment_intent as Stripe.PaymentIntent;
    return { subscriptionId: subscription.id, clientSecret: pi?.client_secret };
  }

  async changePlan(orgId: string, newPlan: string) {
    const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });
    if (!org.stripeSubscriptionId)
      throw new BadRequestException('No active subscription');

    const subscription = await this.stripe.subscriptions.retrieve(org.stripeSubscriptionId);
    await this.stripe.subscriptions.update(org.stripeSubscriptionId, {
      items: [{ id: subscription.items.data[0].id, price: PLAN_PRICE_IDS[newPlan] }],
      proration_behavior: 'always_invoice',
    });
    org.plan = newPlan as any;
    await this.orgRepo.save(org);
  }

  async createPortalSession(orgId: string, returnUrl: string) {
    const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });
    const session = await this.stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId, return_url: returnUrl,
    });
    return { url: session.url };
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await this.orgRepo.update(
          { id: sub.metadata.organizationId },
          { subscriptionStatus: sub.status, plan: sub.metadata.plan as any });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.orgRepo.update(
          { id: sub.metadata.organizationId },
          { subscriptionStatus: 'canceled', plan: 'starter' as any });
        break;
      }
      case 'invoice.payment_failed': {
        // Send dunning email
        break;
      }
    }
  }
}
