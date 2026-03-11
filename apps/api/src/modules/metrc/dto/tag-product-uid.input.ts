import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, Length } from 'class-validator';

@InputType()
export class TagProductUidInput {
  @Field(() => ID) @IsUUID() productId!: string;
  @Field(() => ID) @IsUUID() dispensaryId!: string;
  @Field() @IsString() @Length(1, 50) metrcItemUid!: string;
}
