import { Module } from '@nestjs/common';
import { PlatesService } from './plates.service';
import { PlatesController } from './plates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plate } from './entities/plate.entity';
import { PlateWash } from './entities/plate-wash.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plate, PlateWash])],
  controllers: [PlatesController],
  providers: [PlatesService],
})
export class PlatesModule {}
