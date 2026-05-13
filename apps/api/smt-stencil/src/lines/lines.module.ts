import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plate } from '../plates/entities/plate.entity';
import { Stencil } from '../stencils/entities/stencil.entity';
import { LinesController } from './lines.controller';
import { LinesService } from './lines.service';

@Module({
  imports: [TypeOrmModule.forFeature([Stencil, Plate])],
  controllers: [LinesController],
  providers: [LinesService],
})
export class LinesModule {}
