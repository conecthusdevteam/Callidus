import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stencil } from './entities/stencil.entity';
import { StencilWash } from './entities/stencil-wash.entity';
import { StencilsController } from './stencils.controller';
import { StencilsService } from './stencils.service';

@Module({
  imports: [TypeOrmModule.forFeature([Stencil, StencilWash])],
  controllers: [StencilsController],
  providers: [StencilsService],
})
export class StencilsModule {}
