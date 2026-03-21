import { InputType, Field } from '@nestjs/graphql';
import { IsHexColor, IsOptional, IsString, IsBoolean } from 'class-validator';

@InputType()
export class SaveThemeConfigInput {
  @Field()
  @IsString()
  dispensaryId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  preset?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  primary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  secondary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  accent?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  bgPrimary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  bgSecondary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  bgCard?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  textPrimary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  textSecondary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  sidebarBg?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  sidebarText?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  success?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  warning?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  error?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  info?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDark?: boolean;
}
