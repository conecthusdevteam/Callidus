import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { CreatePlateDto } from './dto/create-plate.dto';
import { UpdatePlateDto } from './dto/update-plate.dto';
import { PlatesService } from './plates.service';

@Controller('plates')
export class PlatesController {
  constructor(private readonly platesService: PlatesService) { }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreatePlateDto) {
    return this.platesService.create(dto);
  }

  @Get()
  findAll() {
    return this.platesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const plate = await this.platesService.findOne(id);
    if (!plate) throw new NotFoundException;
    return plate;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePlateDto) {
    const plate = await this.platesService.update(id, dto);
    if (!plate) throw new NotFoundException;
    return plate; 
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const plate = await this.platesService.remove(id);
    if (!plate) throw new NotFoundException;
  }
}
