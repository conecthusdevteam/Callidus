import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CautelaModule } from './cautela/cautela.module';
import { CautelaEvent } from './cautela/entities/cautela-event.entity';
import { CautelaItem } from './cautela/entities/cautela-item.entity';
import { Cautela } from './cautela/entities/cautela.entity';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { SecurityModule } from './common/security/security.module';
import { Sector } from './sectors/entities/sector.entity';
import { SectorsModule } from './sectors/sectors.module';
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        autoLoadEntities: true,
        database: configService.get<string>('DATABASE_NAME'),
        entities: [User, Sector, Cautela, CautelaItem, CautelaEvent],
        logging: configService.get<string>('DATABASE_LOGGING') === 'true',
        options: {
          encrypt: configService.get<string>('DATABASE_ENCRYPT') !== 'false',
          trustServerCertificate:
            configService.get<string>('DATABASE_TRUST_SERVER_CERTIFICATE') !==
            'false',
        },
        password: configService.get<string>('DATABASE_PASSWORD'),
        port: Number(configService.get<string>('DATABASE_PORT')),
        synchronize: configService.get<string>('DATABASE_SYNCHRONIZE') !== 'false',
        type: 'mssql',
        username: configService.get<string>('DATABASE_USER'),
        host: configService.get<string>('DATABASE_HOST'),
      }),
    }),
    TypeOrmModule.forFeature([User]),
    SecurityModule,
    CautelaModule,
    UserModule,
    AuthModule,
    SectorsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
