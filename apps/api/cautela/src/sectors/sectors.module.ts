import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectorsService } from './sectors.service';
import { SectorsController } from './sectors.controller';
import { Sector } from './entities/sector.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sector, User])],
  controllers: [SectorsController],
  providers: [SectorsService],
  exports: [SectorsService, TypeOrmModule],
})
export class SectorsModule {}
