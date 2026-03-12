import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';

@ObjectType()
export class FacetCount {
  @Field() label!: string;
  @Field() value!: string;
  @Field(() => Int) count!: number;
}

@ObjectType()
export class SearchFacets {
  @Field(() => [FacetCount]) strainTypes!: FacetCount[];
  @Field(() => [FacetCount]) productTypes!: FacetCount[];
  @Field(() => [FacetCount]) effects!: FacetCount[];
  @Field(() => [FacetCount]) flavors!: FacetCount[];
  @Field(() => Float) minPrice!: number;
  @Field(() => Float) maxPrice!: number;
  @Field(() => Float) minThc!: number;
  @Field(() => Float) maxThc!: number;
}

@ObjectType()
export class ProductSearchResult {
  @Field(() => [Product]) products!: Product[];
  @Field(() => Int) total!: number;
  @Field(() => Int) limit!: number;
  @Field(() => Int) offset!: number;
  @Field(() => SearchFacets) facets!: SearchFacets;
}

@ObjectType()
export class AutocompleteResult {
  @Field() id!: string;
  @Field() name!: string;
  @Field({ nullable: true }) strainType?: string;
  @Field({ nullable: true }) productType?: string;
  @Field(() => Float, { nullable: true }) similarity?: number;
}
