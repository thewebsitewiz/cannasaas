import { PartialType } from '@nestjs/mapped-types';
import { CreateDispensaryDto } from './create-dispensary.dto';

export class UpdateDispensaryDto extends PartialType(CreateDispensaryDto) {}
