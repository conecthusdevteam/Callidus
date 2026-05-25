import { Controller, Get } from '@nestjs/common';
import { WashesService } from './washes.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('washes')
@Controller('washes')
export class WashesController {
  constructor(private readonly washesService: WashesService) {}

  @Get('daily-summary')
  @ApiOperation({ summary: 'Retrieve daily summary of washes' })
  @ApiResponse({ status: 200, description: 'Returns the daily summary of washes.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  getDailySummary() {
    return this.washesService.getDailySummary();
  }
}
