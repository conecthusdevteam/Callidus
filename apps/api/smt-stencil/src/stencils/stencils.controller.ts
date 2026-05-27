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
  constructor(private readonly stencilsService: StencilsService) { }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateStencilDto) {
    return this.stencilsService.create(dto);
  }

  @Get()
  async findAll(
    @Query('stencilCode') stencilCode?: string,
    @Query('manufactureId') manufactureId?: string,
    @Query('country') country?: string,
    @Query('status') status?: string,
    @Query('lineName') lineName?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      return this.stencilsService.findAll({
        stencilCode,
        manufactureId,
        country,
        status,
        lineName: lineName,
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

  @Get('lines')
  findLines() {
    return this.stencilsService.findLines();
  }

  @Get('washes')
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

  @Get('washes/today')
  async findTodayWashes(
    @Query('stencilCode') stencilCode?: string,
    @Query('manufactureId') manufactureId?: string,
    @Query('country') country?: string,
    @Query('status') status?: string,
    @Query('lineName') lineName?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      return await this.stencilsService.findTodayStencilWashes({
        stencilCode,
        manufactureId,
        country,
        status,
        lineName: lineName,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error when searching for today\'s stencil washes.',
      );
    }
  }

  @Get('stencilCode/:stencilCode')
  async findByCode(@Param('stencilCode') stencilCode: string) {
    const stencil = await this.stencilsService.findDetailByStencilCode(stencilCode);
    if (!stencil) throw new NotFoundException();
    return stencil;
  }

  @Post(':id/washes')
  @HttpCode(201)
  async createWash(@Param('id') id: string, @Body() dto: CreateStencilWashDto) {
    const wash = await this.stencilsService.createWash(id, dto);
    if (!wash) throw new NotFoundException();
    return wash;
  }

  @Post('stencilCode/:stencilCode/washes')
  @HttpCode(201)
  async createWashByCode(
    @Param('stencilCode') stencilCode: string,
    @Body() dto: CreateStencilWashDto,
  ) {
    const wash = await this.stencilsService.createWashByStencilCode(
      stencilCode,
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
