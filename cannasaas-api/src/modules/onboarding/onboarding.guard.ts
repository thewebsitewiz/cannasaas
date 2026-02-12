mport { Injectable, BadRequestException } from '@nestjs/common';
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
        for (const email of (data.emails || [])) {
          await this.mail.sendStaffInvitation({
            to: email, orgName: org.name, orgId: org.id,
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
    }``

    if (!org.completedSteps) org.completedSteps = [];
    if (!org.completedSteps.includes(step)) org.completedSteps.push(step);

    const idx = STEP_ORDER.indexOf(step);
    org.onboardingStep = idx < STEP_ORDER.length - 1
      ? STEP_ORDER[idx + 1] : OnboardingStep.REVIEW_LAUNCH;
    if (idx === STEP_ORDER.length - 1) org.onboardingComplete = true;

    await this.orgRepo.save(org);
    return this.getStatus(orgId);
  }

  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}