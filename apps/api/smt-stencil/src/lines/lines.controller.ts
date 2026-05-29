import { Controller, Get } from '@nestjs/common';
import { LinesService } from './lines.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('lines')
@Controller('lines')
export class LinesController {
  constructor(private readonly linesService: LinesService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all lines' })
  @ApiResponse({ status: 200, description: 'Returns a list of lines.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  findAll() {
    return this.linesService.findAll();
  }
}
