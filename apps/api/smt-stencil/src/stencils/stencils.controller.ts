import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateStencilWashDto } from './dto/create-stencil-wash.dto';
import { CreateStencilDto } from './dto/create-stencil.dto';
import { UpdateStencilDto } from './dto/update-stencil.dto';
import { StencilsService } from './stencils.service';

@Controller('stencils')
export class StencilsController {
  constructor(private readonly stencilsService: StencilsService) {}

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateStencilDto) {
    return this.stencilsService.create(dto);
  }

  @Get()
  async findAll(
    @Query('codigo') codigo?: string,
    @Query('id_fabricante') id_fabricante?: string,
    @Query('pais_origem') pais_origem?: string,
    @Query('status') status?: string,
    @Query('linha') linha?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      return this.stencilsService.findAll({
        codigo,
        id_fabricante,
        pais_origem,
        status,
        linha,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error when searching for stencils.',
      );
    }
  }

  @Get('linhas')
  findLines() {
    return this.stencilsService.findLines();
  }

  @Get('lavagens')
  findRecentWashes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('attentionOnly') attentionOnly?: string,
  ) {
    return this.stencilsService.findRecentWashes({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      attentionOnly: attentionOnly === 'true',
    });
  }

  @Get('codigo/:codigo')
  async findByCode(@Param('codigo') codigo: string) {
    const stencil = await this.stencilsService.findDetailByStencilCode(codigo);
    if (!stencil) throw new NotFoundException();
    return stencil;
  }

  @Post(':id/lavagens')
  @HttpCode(201)
  async createWash(@Param('id') id: string, @Body() dto: CreateStencilWashDto) {
    const wash = await this.stencilsService.createWash(id, dto);
    if (!wash) throw new NotFoundException();
    return wash;
  }

  @Post('codigo/:codigo/lavagens')
  @HttpCode(201)
  async createWashByCode(
    @Param('codigo') codigo: string,
    @Body() dto: CreateStencilWashDto,
  ) {
    const wash = await this.stencilsService.createWashByStencilCode(
      codigo,
      dto,
    );
    if (!wash) throw new NotFoundException();
    return wash;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const stencil = await this.stencilsService.findOne(id);
    if (!stencil) throw new NotFoundException();
    return stencil;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateStencilDto) {
    const stencil = await this.stencilsService.update(id, dto);
    if (!stencil) throw new NotFoundException();
    return stencil;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const stencil = await this.stencilsService.remove(id);
    if (!stencil) throw new NotFoundException();
  }
}
