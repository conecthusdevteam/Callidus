import { PartialType } from '@nestjs/swagger';
import { CreateStencilDto } from './create-stencil.dto';

export class UpdateStencilDto extends PartialType(CreateStencilDto) { }
