import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePlateWashDto } from './dto/create-plate-wash.dto';
import { CreatePlateDto } from './dto/create-plate.dto';
import { UpdatePlateDto } from './dto/update-plate.dto';
import { PlatesService } from './plates.service';

@Controller('plates')
export class PlatesController {
  constructor(private readonly platesService: PlatesService) {}

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePlateDto) {
    return this.platesService.create(dto);
  }

  @Get()
  async findAll(
    @Query('modelo') modelo?: string,
    @Query('blank_id') blank_id?: string,
    @Query('serial') serial?: string,
    @Query('linha') linha?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      return this.platesService.findAll({
        modelo,
        blank_id,
        serial,
        linha,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error when searching for plates.',
      );
    }
  }

  @Get('lavagens')
  findRecentWashes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.platesService.findRecentWashes({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const plate = await this.platesService.findOne(id);
    if (!plate) throw new NotFoundException();
    return plate;
  }

  @Post(':id/lavagens')
  @HttpCode(201)
  async createWash(@Param('id') id: string, @Body() dto: CreatePlateWashDto) {
    const wash = await this.platesService.createWash(id, dto);
    if (!wash) throw new NotFoundException();
    return wash;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePlateDto) {
    const plate = await this.platesService.update(id, dto);
    if (!plate) throw new NotFoundException();
    return plate;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const plate = await this.platesService.remove(id);
    if (!plate) throw new NotFoundException();
  }
}
