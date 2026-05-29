import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { WashStatus } from '../entities/stencil.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStencilDto {
  @ApiProperty({
    description: 'The code of the stencil',
    example: 'SME-500-0018',
  })
  @IsString()
  stencilCode!: string;

  @ApiProperty({
    description: 'The ID of the stencil manufacturer',
    example: 'MNF-006',
  })
  @IsString()
  manufactureId!: string;

  @ApiProperty({
    description: 'The country of origin of the stencil',
    example: 'China',
  })
  @IsString()
  country!: string;

  @ApiProperty({
    description: 'The thickness of the stencil',
    example: 0.069,
  })
  @IsNumber()
  thickness!: number;

  @ApiProperty({
    description: 'The address where the stencil is located in the rack',
    example: "079",
  })
  @IsString()
  addressing!: string;

  @ApiProperty({
    description: 'The name of the line where the stencil is used',
    example: 'Manicoré',
  })
  @IsString()
  lineName!: string;

  @ApiProperty({
    description: 'The status of the stencil wash',
    example: 'active',
    enum: WashStatus,
  })
  @IsOptional()
  @IsEnum(WashStatus)
  status?: WashStatus;
}
