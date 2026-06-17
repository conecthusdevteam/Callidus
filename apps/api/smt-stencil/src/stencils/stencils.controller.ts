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
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('stencils')
@Controller('stencils')
export class StencilsController {
  constructor(private readonly stencilsService: StencilsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new stencil' })
  @ApiResponse({
    status: 201,
    description: 'The stencil has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @HttpCode(201)
  create(@Body() dto: CreateStencilDto) {
    return this.stencilsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all stencils' })
  @ApiResponse({ status: 200, description: 'Returns a list of stencils.' })
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
  @ApiOperation({ summary: 'Retrieve all stencil lines' })
  @ApiResponse({ status: 200, description: 'Returns a list of stencil lines.' })
  findLines() {
    return this.stencilsService.findLines();
  }

  @Get('washes')
  @ApiOperation({ summary: 'Retrieve recent stencil washes' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of recent stencil washes.',
  })
  findRecentWashes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('attentionOnly') attentionOnly?: string,
    @Query('stencilCode') stencilCode?: string,
    @Query('addressing') addressing?: string,
    @Query('manufactureId') manufactureId?: string,
    @Query('country') country?: string,
    @Query('operator') operator?: string,
    @Query('occurrence') occurrence?: 'planned' | 'anomalous' | 'multiple',
    @Query('status') status?: string,
    @Query('lineName') lineName?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.stencilsService.findRecentWashes({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      attentionOnly: attentionOnly === 'true',
      ...(stencilCode ? { stencilCode } : {}),
      ...(addressing ? { addressing } : {}),
      ...(manufactureId ? { manufactureId } : {}),
      ...(country ? { country } : {}),
      ...(operator ? { operator } : {}),
      ...(occurrence ? { occurrence } : {}),
      ...(status ? { status } : {}),
      ...(lineName ? { lineName } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      ...(sort ? { sort } : {}),
    });
  }

  @Get('washes/today')
  @ApiOperation({ summary: "Retrieve today's stencil washes" })
  @ApiQuery({
    name: 'stencilCode',
    required: false,
    type: String,
    description: 'Filter by stencil code',
  })
  @ApiQuery({
    name: 'manufactureId',
    required: false,
    type: String,
    description: 'Filter by manufacture ID',
  })
  @ApiQuery({
    name: 'country',
    required: false,
    type: String,
    description: 'Filter by country',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'lineName',
    required: false,
    type: String,
    description: 'Filter by line name',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: "Returns a list of today's stencil washes.",
  })
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
        "Error when searching for today's stencil washes.",
      );
    }
  }

  @Get('stencilCode/:stencilCode')
  @ApiOperation({ summary: 'Retrieve a specific stencil by code' })
  @ApiResponse({ status: 200, description: 'Returns the requested stencil.' })
  @ApiResponse({ status: 404, description: 'Stencil not found.' })
  async findByCode(@Param('stencilCode') stencilCode: string) {
    const stencil =
      await this.stencilsService.findDetailByStencilCode(stencilCode);
    if (!stencil) throw new NotFoundException();
    return stencil;
  }

  @Post(':id/washes')
  @ApiOperation({ summary: 'Create a wash record for a specific stencil' })
  @ApiResponse({
    status: 201,
    description: 'The wash record has been successfully created.',
  })
  @ApiResponse({ status: 404, description: 'Stencil not found.' })
  @ApiResponse({
    status: 409,
    description: 'Inactive stencil cannot receive new washes.',
  })
  @HttpCode(201)
  async createWash(@Param('id') id: string, @Body() dto: CreateStencilWashDto) {
    const wash = await this.stencilsService.createWash(id, dto);
    if (!wash) throw new NotFoundException();
    return wash;
  }

  @Post('stencilCode/:stencilCode/washes')
  @ApiOperation({
    summary: 'Create a wash record for a specific stencil by code',
  })
  @ApiResponse({
    status: 201,
    description: 'The wash record has been successfully created.',
  })
  @ApiResponse({ status: 404, description: 'Stencil not found.' })
  @ApiResponse({
    status: 409,
    description: 'Inactive stencil cannot receive new washes.',
  })
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

  @Get(':id/wash-analytics')
  @ApiOperation({
    summary: 'Retrieve stencil wash analytics for the selected period',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns classified wash analytics.',
  })
  @ApiResponse({ status: 404, description: 'Stencil not found.' })
  async findWashAnalytics(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const analytics = await this.stencilsService.findWashAnalytics(
      id,
      days ? Number(days) : undefined,
    );
    if (!analytics) throw new NotFoundException();
    return analytics;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific stencil' })
  @ApiResponse({ status: 200, description: 'Returns the requested stencil.' })
  @ApiResponse({ status: 404, description: 'Stencil not found.' })
  async findOne(@Param('id') id: string) {
    const stencil = await this.stencilsService.findOne(id);
    if (!stencil) throw new NotFoundException();
    return stencil;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific stencil' })
  @ApiResponse({ status: 200, description: 'Returns the updated stencil.' })
  @ApiResponse({ status: 404, description: 'Stencil not found.' })
  async update(@Param('id') id: string, @Body() dto: UpdateStencilDto) {
    const stencil = await this.stencilsService.update(id, dto);
    if (!stencil) throw new NotFoundException();
    return stencil;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific stencil' })
  @ApiResponse({
    status: 204,
    description: 'The stencil has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Stencil not found.' })
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const stencil = await this.stencilsService.remove(id);
    if (!stencil) throw new NotFoundException();
  }
}
