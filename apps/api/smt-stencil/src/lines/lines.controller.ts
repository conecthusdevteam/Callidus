import { Controller, Get } from '@nestjs/common';
import { LinesService } from './lines.service';

@Controller('linhas')
export class LinesController {
  constructor(private readonly linesService: LinesService) {}

  @Get()
  findAll() {
    return this.linesService.findAll();
  }
}
