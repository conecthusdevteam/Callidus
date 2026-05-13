import { Controller, Get } from '@nestjs/common';
import { WashesService } from './washes.service';

@Controller('lavagens')
export class WashesController {
  constructor(private readonly washesService: WashesService) {}

  @Get('resumo-dia')
  getDailySummary() {
    return this.washesService.getDailySummary();
  }
}
