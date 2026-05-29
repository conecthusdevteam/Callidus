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
import { CreatePlateWashDto } from './dto/create-plate-wash.dto';
import { CreatePlateDto } from './dto/create-plate.dto';
import { UpdatePlateDto } from './dto/update-plate.dto';
import { PlatesService } from './plates.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('plates')
@Controller('plates')
export class PlatesController {
  constructor(private readonly platesService: PlatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plate' })
  @ApiResponse({ status: 201, description: 'The plate has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @HttpCode(201)
  create(@Body() dto: CreatePlateDto) {
    return this.platesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all plates' })
  @ApiResponse({ status: 200, description: 'Returns a list of plates.' })
  async findAll(
    @Query('plate_model') plate_model?: string,
    @Query('blank_id') blank_id?: string,
    @Query('serial') serial?: string,
    @Query('line') line?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      return this.platesService.findAll({
        plate_model: plate_model,
        blank_id,
        serial,
        line: line,
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

  @Get('washes')
  @ApiOperation({ summary: 'Retrieve recent plate washes' })
  @ApiResponse({ status: 200, description: 'Returns a list of recent plate washes.' })
  findRecentWashes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.platesService.findRecentWashes({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
  
  @Get('washes/today')
  @ApiOperation({ summary: 'Retrieve today\'s plate washes' })
  @ApiQuery({ name: 'plate_model', required: false, description: 'Filter by plate model' })
  @ApiQuery({ name: 'blank_id', required: false, description: 'Filter by blank ID' })
  @ApiQuery({ name: 'serial', required: false, description: 'Filter by serial number' })
  @ApiQuery({ name: 'line', required: false, description: 'Filter by production line' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({ status: 200, description: 'Returns a list of today\'s plate washes.' })
  async findTodayWashes(
    @Query('plate_model') plate_model?: string,
    @Query('blank_id') blank_id?: string,
    @Query('serial') serial?: string,
    @Query('line') line?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      return await this.platesService.findTodayPlateWashes({
        plate_model: plate_model,
        blank_id: blank_id,
        serial: serial,
        line: line,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error when searching for today\'s plate washes.',
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific plate' })
  @ApiResponse({ status: 200, description: 'Returns the requested plate.' })
  @ApiResponse({ status: 404, description: 'Plate not found.' })
  async findOne(@Param('id') id: string) {
    const plate = await this.platesService.findOne(id);
    if (!plate) throw new NotFoundException();
    return plate;
  }

  @Post(':id/washes')
  @ApiOperation({ summary: 'Create a wash record for a specific plate' })
  @ApiResponse({ status: 201, description: 'The wash record has been successfully created.' })
  @ApiResponse({ status: 404, description: 'Plate not found.' })
  @HttpCode(201)
  async createWash(@Param('id') id: string, @Body() dto: CreatePlateWashDto) {
    const wash = await this.platesService.createWash(id, dto);
    if (!wash) throw new NotFoundException();
    return wash;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific plate' })
  @ApiResponse({ status: 200, description: 'Returns the updated plate.' })
  @ApiResponse({ status: 404, description: 'Plate not found.' })
  async update(@Param('id') id: string, @Body() dto: UpdatePlateDto) {
    const plate = await this.platesService.update(id, dto);
    if (!plate) throw new NotFoundException();
    return plate;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific plate' })
  @ApiResponse({ status: 204, description: 'The plate has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Plate not found.' })
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const plate = await this.platesService.remove(id);
    if (!plate) throw new NotFoundException();
  }
}
