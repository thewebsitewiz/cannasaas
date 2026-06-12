import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * Thin per-dispensary projection used by `myThemableDispensaries`. The
 * admin UI's theme picker shows one card per dispensary the caller is
 * allowed to theme — name + slug for identification, the current preset
 * + logoUrl for a small thumbnail.
 */
@ObjectType()
export class ThemableDispensary {
  @Field(() => ID)
  entityId!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => String, { nullable: true })
  preset?: string | null;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;
}
