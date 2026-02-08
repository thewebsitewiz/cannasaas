import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DispensariesService } from './dispensaries.service';
import { UploadService } from '../upload/upload.service';
import { CreateDispensaryDto } from './dto/create-dispensary.dto';
import { UpdateDispensaryDto } from './dto/update-dispensary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('dispensaries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DispensariesController {
  constructor(
    private dispensariesService: DispensariesService,
    private uploadService: UploadService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  create(@Body() createDto: CreateDispensaryDto) {
    return this.dispensariesService.create(createDto);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.dispensariesService.findAll(companyId);
  }

  @Get('nearby')
  findNearby(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius: number = 10,
  ) {
    return this.dispensariesService.findNearby(latitude, longitude, radius);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dispensariesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.DISPENSARY_MANAGER)
  update(@Param('id') id: string, @Body() updateDto: UpdateDispensaryDto) {
    return this.dispensariesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  remove(@Param('id') id: string) {
    return this.dispensariesService.remove(id);
  }

  @Post(':id/branding/logo')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.DISPENSARY_MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const logoUrl = await this.uploadService.uploadLogo(file, id);
    return this.dispensariesService.updateBranding(id, { logoUrl });
  }

  @Put(':id/branding')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.DISPENSARY_MANAGER)
  updateBranding(@Param('id') id: string, @Body() updateDto: any) {
    return this.dispensariesService.updateBranding(id, updateDto);
  }
}