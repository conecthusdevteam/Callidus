import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { CreateStencilDto } from './dto/create-stencil.dto';
import { UpdateStencilDto } from './dto/update-stencil.dto';
import { StencilsService } from './stencils.service';

@Controller('stencils')
export class StencilsController {
  constructor(private readonly stencilsService: StencilsService) { }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateStencilDto) {
    return this.stencilsService.create(dto);
  }

  @Get()
  findAll() {
    return this.stencilsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const stencil = await this.stencilsService.findOne(id);
    if (!stencil) throw new NotFoundException;
    return stencil;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateStencilDto) {
    const stencil = await this.stencilsService.update(id, dto);
    if (!stencil) throw new NotFoundException;
    return stencil;
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    const stencil = this.stencilsService.remove(id);
    if (!stencil) throw new NotFoundException;
  }
}
