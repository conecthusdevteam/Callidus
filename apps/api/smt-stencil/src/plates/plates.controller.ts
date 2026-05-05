import { Body, Controller, Delete, Get, HttpCode, InternalServerErrorException, NotFoundException, Param, Patch, Post } from '@nestjs/common';
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
  async findAll() {
    try {
      const plates = await this.platesService.findAll();
  
      if (!plates || plates.length === 0) {
        throw new NotFoundException('No plates found');
      }
  
      return plates;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error when searching for plates.');
    }
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
