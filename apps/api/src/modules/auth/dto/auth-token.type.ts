import { ObjectType, Field, Int } from '@nestjs/graphql';
@ObjectType()
export class AuthToken {
  @Field() accessToken!: string;
  @Field(() => Int) expiresIn!: number;
  refreshToken?: string;
}
