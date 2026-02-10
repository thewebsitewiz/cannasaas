import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/aws.config';
import databaseConfig from './config/database.config';

// Import new modules
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { DispensariesModule } from './dispensaries/dispensaries.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [
        ConfigModule,
        OrganizationsModule,
        CompaniesModule,
        DispensariesModule,
        UploadModule,
      ],
      useFactory: (configService: ConfigService) => {
        const password = configService.get('database.postgres.password');
        console.log('DB CONFIG:', {
          host: configService.get('database.host'),
          password: typeof password, // don't log the actual password
          passwordValue: password, // temporarily log it to debug
        });

        return {
          type: 'postgres',
          host: configService.get('database.postgres.host'),
          port: configService.get('database.port'),
          username: configService.get('database.postgres.username'),
          password: configService.get('database.postgres.password'),
          database: configService.get('database.database'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: true, // TODO Set to false in production
          logging: configService.get('database.logging'),
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    OrganizationsModule,
    CompaniesModule,
    DispensariesModule,
    UploadModule,
  ],
})
export class AppModule {}
