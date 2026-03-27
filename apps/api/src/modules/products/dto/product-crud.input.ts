import { InputType, Field, ID, Float, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Matches } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) dispensaryId!: string;
  @Field() @IsString() name!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() description?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() strainType?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() strainName?: string;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() thcPercent?: number;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() cbdPercent?: number;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() isActive?: boolean;

  // Variant + pricing shortcut
  @Field({ nullable: true }) @IsOptional() @IsString() variantName?: string;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() @Min(0) variantQuantityG?: number;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() @Min(0) retailPrice?: number;
}

@InputType()
export class UpdateProductInput {
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) productId!: string;
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) dispensaryId!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() name?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() description?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() strainType?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() strainName?: string;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() thcPercent?: number;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() cbdPercent?: number;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() isActive?: boolean;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() isApproved?: boolean;
}

@InputType()
export class UpdateVariantPriceInput {
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) variantId!: string;
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) dispensaryId!: string;
  @Field(() => Float) @IsNumber() @Min(0) price!: number;
}
