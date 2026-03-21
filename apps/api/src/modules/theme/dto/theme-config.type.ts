import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ThemeConfigType {
  @Field(() => ID)
  id: string;

  @Field()
  dispensaryId: string;

  @Field()
  preset: string;

  @Field()
  primary: string;

  @Field()
  secondary: string;

  @Field()
  accent: string;

  @Field()
  bgPrimary: string;

  @Field()
  bgSecondary: string;

  @Field()
  bgCard: string;

  @Field()
  textPrimary: string;

  @Field()
  textSecondary: string;

  @Field()
  sidebarBg: string;

  @Field()
  sidebarText: string;

  @Field()
  success: string;

  @Field()
  warning: string;

  @Field()
  error: string;

  @Field()
  info: string;

  @Field()
  isDark: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
