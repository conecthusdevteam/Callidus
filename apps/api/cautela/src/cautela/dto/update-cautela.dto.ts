import { PartialType } from '@nestjs/mapped-types';
import { CreateCautelaDto } from './create-cautela.dto';

export class UpdateCautelaDto extends PartialType(CreateCautelaDto) {}
