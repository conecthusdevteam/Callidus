import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Plate } from './plates/entities/plate.entity';
import { PlatesModule } from './plates/plates.module';
import { Stencil } from './stencils/entities/stencil.entity';
import { StencilsModule } from './stencils/stencils.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Stencil, Plate],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true,
        }
      })
    }),
    StencilsModule,
    PlatesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
