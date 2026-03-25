import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, Length, Matches, } from 'class-validator';

@InputType()
export class TagProductUidInput {
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) productId!: string;
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) dispensaryId!: string;
  @Field() @IsString() @Length(1, 50) metrcItemUid!: string;
}
