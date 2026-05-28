import { PartialType } from '@nestjs/swagger';
import { CreatePlateDto } from './create-plate.dto';

export class UpdatePlateDto extends PartialType(CreatePlateDto) { }
