import { InputType, Field, ID, Int, Float } from '@nestjs/graphql';
import { IsOptional, IsUUID, IsString, IsNumber, Min, Max, IsIn, IsArray } from 'class-validator';

@InputType()
export class ProductSearchInput {
  @Field(() => ID)
  @IsUUID("all")
  dispensaryId!: string;

  @Field({ nullable: true })
  @IsOptional() @IsString()
  search?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional() @IsNumber()
  productTypeId?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional() @IsNumber()
  categoryId?: number;

  @Field({ nullable: true })
  @IsOptional() @IsString() @IsIn(['indica', 'sativa', 'hybrid'])
  strainType?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional() @IsArray()
  effects?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional() @IsArray()
  flavors?: string[];

  @Field(() => Float, { nullable: true })
  @IsOptional() @IsNumber() @Min(0)
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional() @IsNumber() @Min(0)
  maxPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  minThc?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  maxThc?: number;

  @Field({ nullable: true })
  @IsOptional() @IsString() @IsIn(['relevance', 'name', 'price_asc', 'price_desc', 'thc_desc', 'newest'])
  sortBy?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional() @IsNumber() @Min(1) @Max(100)
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional() @IsNumber() @Min(0)
  offset?: number;
}
