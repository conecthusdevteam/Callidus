import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlateWash } from '../plates/entities/plate-wash.entity';
import { StencilWash } from '../stencils/entities/stencil-wash.entity';
import { WashesController } from './washes.controller';
import { WashesService } from './washes.service';

@Module({
  imports: [TypeOrmModule.forFeature([StencilWash, PlateWash])],
  controllers: [WashesController],
  providers: [WashesService],
})
export class WashesModule {}
