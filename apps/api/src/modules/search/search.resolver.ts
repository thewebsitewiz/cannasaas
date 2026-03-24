import { Resolver, Query, Mutation, Args, Float, Int, ObjectType, Field, InputType } from '@nestjs/graphql';
import { SearchService } from './search.service';

@ObjectType()
class SearchResultType {
  @Field() productId!: string;
  @Field() name!: string;
  @Field({ nullable: true }) strainType?: string;
  @Field(() => Float, { nullable: true }) thcPercent?: number;
  @Field(() => Float, { nullable: true }) cbdPercent?: number;
  @Field(() => [String], { nullable: true }) effects?: string[];
  @Field(() => [String], { nullable: true }) flavors?: string[];
  @Field(() => [String], { nullable: true }) terpenes?: string[];
  @Field(() => Float) score!: number;
}

@InputType()
class SearchFiltersInput {
  @Field({ nullable: true }) strainType?: string;
  @Field(() => [String], { nullable: true }) effects?: string[];
  @Field(() => Float, { nullable: true }) minThc?: number;
  @Field(() => Float, { nullable: true }) maxThc?: number;
}

@Resolver()
export class SearchResolver {
  constructor(private readonly searchService: SearchService) {}

  @Query(() => [SearchResultType], { name: 'searchProducts' })
  async searchProducts(
    @Args('query') query: string,
    @Args('dispensaryId') dispensaryId: string,
    @Args('filters', { nullable: true }) filters?: SearchFiltersInput,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit?: number,
  ): Promise<SearchResultType[]> {
    return this.searchService.search(query, dispensaryId, filters ?? undefined, limit);
  }

  @Query(() => [SearchResultType], { name: 'vibeSearch' })
  async vibeSearch(
    @Args('vibe') vibe: string,
    @Args('dispensaryId') dispensaryId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit?: number,
  ): Promise<SearchResultType[]> {
    return this.searchService.vibeSearch(vibe, dispensaryId, limit);
  }

  @Mutation(() => Int, { name: 'indexProducts' })
  async indexProducts(
    @Args('dispensaryId') dispensaryId: string,
  ): Promise<number> {
    return this.searchService.indexProducts(dispensaryId);
  }
}
