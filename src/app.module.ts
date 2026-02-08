import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Import new modules
import { OrganizationsModule } from './organizations/organizations.module';
import { CompaniesModule } from './companies/companies.module';
import { DispensariesModule } from './dispensaries/dispensaries.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: configService.get('database.logging'),
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    OrganizationsModule,
    CompaniesModule,
    DispensariesModule,
    UploadModule,
  ],
})
export class AppModule {}