import { DataSource } from 'typeorm';
import { join } from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://cannasaas:dev_password_only@localhost:5432/cannasaas_dev',
  entities: [join(__dirname, 'modules/**/*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
  synchronize: false,
});
