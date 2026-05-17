#!/usr/bin/env python3
"""
Adds customerByPhone query to the API and a corresponding GraphQL operation
to @cannasaas/ui-ng. Idempotent — safe to re-run.

Run from repo root.
"""
import re
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# 1. New DTO
# ─────────────────────────────────────────────────────────────────────────────
DTO_PATH = Path("apps/api/src/modules/customers/dto/kiosk-customer-lookup.type.ts")
DTO_CONTENT = """import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/**
 * Lightweight kiosk-facing customer record. Joins customer_profiles with
 * users so the kiosk can greet by name without exposing the full
 * CustomerProfile shape. Returned by the `customerByPhone` query.
 */
@ObjectType()
export class KioskCustomerLookup {
  @Field(() => ID)
  customerId!: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field(() => Int)
  loyaltyPoints!: number;
}
"""
DTO_PATH.parent.mkdir(parents=True, exist_ok=True)
DTO_PATH.write_text(DTO_CONTENT)
print(f"✓ wrote {DTO_PATH}")

# ─────────────────────────────────────────────────────────────────────────────
# 2. Resolver — add customerByPhone query before the final `}`
# ─────────────────────────────────────────────────────────────────────────────
RES_PATH = Path("apps/api/src/modules/customers/customer.resolver.ts")
res = RES_PATH.read_text()

# Add imports
if "ForbiddenException" not in res:
    res = res.replace(
        "import { Resolver, Query, Mutation, Args, ID, Int, Float } from '@nestjs/graphql';",
        "import { Resolver, Query, Mutation, Args, ID, Int, Float } from '@nestjs/graphql';\n"
        "import { ForbiddenException } from '@nestjs/common';",
    )

if "KioskCustomerLookup" not in res:
    res = res.replace(
        "import { CustomerService } from './customer.service';",
        "import { CustomerService } from './customer.service';\n"
        "import { KioskCustomerLookup } from './dto/kiosk-customer-lookup.type';",
    )

# Insert the query before the trailing `}` of the class
INSERT = '''
  @Roles('kiosk', 'budtender', 'dispensary_admin')
  @Query(() => KioskCustomerLookup, { name: 'customerByPhone', nullable: true })
  async customerByPhone(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('phone') phone: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<KioskCustomerLookup | null> {
    // Enforce tenant scope — kiosk/budtender tokens are dispensary-bound.
    if (user.dispensaryId && user.dispensaryId !== dispensaryId) {
      throw new ForbiddenException('Cross-dispensary lookup not allowed');
    }
    return this.customers.findByPhoneForKiosk(dispensaryId, phone);
  }
'''
if "customerByPhone" not in res:
    # Find the final `}` of the class (last occurrence)
    last_brace = res.rfind("}")
    res = res[:last_brace] + INSERT + res[last_brace:]
RES_PATH.write_text(res)
print(f"✓ patched {RES_PATH}")

# ─────────────────────────────────────────────────────────────────────────────
# 3. Service — add findByPhoneForKiosk
# ─────────────────────────────────────────────────────────────────────────────
SVC_PATH = Path("apps/api/src/modules/customers/customer.service.ts")
svc = SVC_PATH.read_text()

if "KioskCustomerLookup" not in svc:
    svc = svc.replace(
        "import { CustomerProfile } from './entities/customer.entity';",
        "import { CustomerProfile } from './entities/customer.entity';\n"
        "import { KioskCustomerLookup } from './dto/kiosk-customer-lookup.type';",
    )

SVC_INSERT = '''
  /**
   * Look up a customer by 10-digit phone, scoped to a dispensary.
   *
   * Phone matching is digit-normalized on both sides (regexp_replace strips
   * non-digits in the column), so dirty legacy data like "(555) 123-4567"
   * still matches a normalized "5551234567" input. Tenant scope uses
   * `preferred_dispensary_id` — customers without a preferred dispensary
   * are invisible to kiosk lookup and fall through to the guest flow.
   *
   * Returns null if the phone isn't exactly 10 digits after normalization
   * or no customer is found.
   */
  async findByPhoneForKiosk(
    dispensaryId: string,
    phoneInput: string,
  ): Promise<KioskCustomerLookup | null> {
    const normalized = (phoneInput ?? '').replace(/\\D/g, '');
    if (normalized.length !== 10) return null;

    const rows = await this.ds.query<
      Array<{
        customer_id: string;
        first_name: string | null;
        last_name: string | null;
        loyalty_points: number;
      }>
    >(
      `SELECT
         cp.user_id        AS customer_id,
         u.first_name      AS first_name,
         u.last_name       AS last_name,
         cp.loyalty_points AS loyalty_points
       FROM customer_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.preferred_dispensary_id = $1
         AND regexp_replace(COALESCE(cp.phone, ''), '[^0-9]', '', 'g') = $2
       LIMIT 1`,
      [dispensaryId, normalized],
    );

    const row = rows[0];
    if (!row) return null;
    return {
      customerId: row.customer_id,
      firstName: row.first_name ?? undefined,
      lastName: row.last_name ?? undefined,
      loyaltyPoints: Number(row.loyalty_points ?? 0),
    };
  }
'''
if "findByPhoneForKiosk" not in svc:
    last_brace = svc.rfind("}")
    svc = svc[:last_brace] + SVC_INSERT + svc[last_brace:]
SVC_PATH.write_text(svc)
print(f"✓ patched {SVC_PATH}")

# ─────────────────────────────────────────────────────────────────────────────
# 4. GraphQL operation for codegen
# ─────────────────────────────────────────────────────────────────────────────
OP_PATH = Path("packages/angular/projects/ui/src/lib/graphql/operations/customer-by-phone.graphql")
OP_CONTENT = """query CustomerByPhone($dispensaryId: ID!, $phone: String!) {
  customerByPhone(dispensaryId: $dispensaryId, phone: $phone) {
    customerId
    firstName
    lastName
    loyaltyPoints
  }
}
"""
OP_PATH.write_text(OP_CONTENT)
print(f"✓ wrote {OP_PATH}")

print("""
Next steps (in order):
  1. Restart the API so NestJS regenerates apps/api/schema.gql:
       restartapi
  2. Regen the Angular GraphQL types from the new schema:
       pnpm --filter angular run codegen
  3. Verify CustomerByPhoneGQL is exported:
       grep CustomerByPhoneGQL packages/angular/projects/ui/src/lib/graphql/generated.ts
""")
