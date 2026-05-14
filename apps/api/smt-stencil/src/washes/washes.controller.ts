import { Controller, Get } from '@nestjs/common';
import { WashesService } from './washes.service';

@Controller('washes')
export class WashesController {
  constructor(private readonly washesService: WashesService) {}

  @Get('daily-summary')
  getDailySummary() {
    return this.washesService.getDailySummary();
  }
}
