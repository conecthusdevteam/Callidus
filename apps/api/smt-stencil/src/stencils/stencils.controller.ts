  import { Body, Controller, Delete, Get, HttpCode, HttpException, InternalServerErrorException, NotFoundException, Param, Patch, Post } from '@nestjs/common';
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
  async findAll() {
    try {
      const stencils = await this.stencilsService.findAll();
  
      if (!stencils || stencils.length === 0) {
        throw new NotFoundException('No stencils found');
      }
  
      return stencils;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Error when searching for stencils.');
    }
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
  async remove(@Param('id') id: string) {
    const stencil = await this.stencilsService.remove(id);
    if (!stencil) throw new NotFoundException;
  }
}
