import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { CurrentUserPayload } from '../common/interfaces/current-user-payload.interface';
import { CautelaService } from './cautela.service';
import { CreateCautelaDto } from './dto/create-cautela.dto';
import { ListCautelasDto } from './dto/list-cautelas.dto';
import { RejectCautelaDto } from './dto/reject-cautela.dto';

@Controller('cautelas')
export class CautelaController {
  constructor(private readonly cautelaService: CautelaService) {}

  @Roles(UserRole.PORTARIA)
  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createCautelaDto: CreateCautelaDto,
  ) {
    return this.cautelaService.create(user, createCautelaDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListCautelasDto,
  ) {
    return this.cautelaService.findAll(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.cautelaService.findOne(id, user);
  }

  @Roles(UserRole.GESTOR)
  @Patch(':id/aprovar')
  approve(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.cautelaService.approve(id, user);
  }

  @Roles(UserRole.GESTOR)
  @Patch(':id/reprovar')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() rejectCautelaDto: RejectCautelaDto,
  ) {
    return this.cautelaService.reject(id, user, rejectCautelaDto);
  }
}
