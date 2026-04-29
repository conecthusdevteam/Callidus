import 'reflect-metadata';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { CautelaEvent } from '../cautela/entities/cautela-event.entity';
import { CautelaItem } from '../cautela/entities/cautela-item.entity';
import { Cautela } from '../cautela/entities/cautela.entity';
import { Sector } from '../sectors/entities/sector.entity';
import { User } from '../user/entities/user.entity';

const envPath = resolve(process.cwd(), '.env');

if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, 'utf8');

  for (const line of envFile.split('\n')) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    process.env[key] ??= value.replace(/^["']|["']$/g, '');
  }
}

export default new DataSource({
  database: process.env.DATABASE_NAME,
  entities: [User, Sector, Cautela, CautelaItem, CautelaEvent],
  logging: process.env.DATABASE_LOGGING === 'true',
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  options: {
    encrypt: process.env.DATABASE_ENCRYPT !== 'false',
    trustServerCertificate: process.env.DATABASE_TRUST_SERVER_CERTIFICATE !== 'false',
  },
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env.DATABASE_PORT),
  synchronize: false,
  type: 'mssql',
  username: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
});
