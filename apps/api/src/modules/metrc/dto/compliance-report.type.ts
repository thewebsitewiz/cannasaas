import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class ComplianceIssue {
  @Field(() => ID) productId!: string;
  @Field() productName!: string;
  @Field(() => [String]) issues!: string[];
}

@ObjectType()
export class ComplianceReport {
  @Field(() => ID) dispensaryId!: string;
  @Field() totalProducts!: number;
  @Field() compliantProducts!: number;
  @Field() nonCompliantProducts!: number;
  @Field(() => Int) compliancePercent!: number;
  @Field(() => [ComplianceIssue]) issues!: ComplianceIssue[];
  @Field() generatedAt!: Date;
}
