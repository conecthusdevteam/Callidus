import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CautelaService } from './cautela.service';
import { CautelaController } from './cautela.controller';
import { Sector } from '../sectors/entities/sector.entity';
import { User } from '../user/entities/user.entity';
import { Cautela } from './entities/cautela.entity';
import { CautelaEvent } from './entities/cautela-event.entity';
import { CautelaItem } from './entities/cautela-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cautela, CautelaItem, CautelaEvent, Sector, User])],
  controllers: [CautelaController],
  providers: [CautelaService],
})
export class CautelaModule {}
