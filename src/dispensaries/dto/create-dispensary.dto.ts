import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class CreateDispensaryDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(255)
  streetAddress!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  @Matches(/^[A-Z]{2}$/)
  state!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(10)
  @Matches(/^\d{5}(-\d{4})?$/)
  zipCode!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  operatingHours?: any;
}
