import { PartialType } from '@nestjs/mapped-types';
import { CreateStencilDto } from './create-stencil.dto';

export class UpdateStencilDto extends PartialType(CreateStencilDto) {}
