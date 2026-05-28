import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePlateDto {
  @ApiProperty({
    description: 'The code of the plate model',
    example: 'PCB-1000',
  })
  @IsString()
  plateModel!: string;

  @ApiProperty({
    description: 'The serial number of the plate',
    example: 'PCB-1000-000017',
  })
  @IsString()
  serialNumber!: string;

  @ApiProperty({
    description: 'The ID of the plate blank',
    example: 'BLANK-7937',
  })
  @IsString()
  blankId!: string;

  @ApiProperty({
    description: 'The name of the line where the plate is produced',
    example: 'Manaus',
  })
  @IsString()
  lineName!: string;

  @ApiProperty({
    description: 'The ID of the plate manufacturer',
    example: 'MNF-003',
  })
  @IsOptional()
  @IsString()
  plateManufacturerId?: string;

  @ApiProperty({
    description: 'The country of origin of the plate',
    example: 'USA',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'The thickness of the plate',
    example: 0.5,
  })
  @IsOptional()
  @IsNumber()
  thickness?: number;

  @ApiProperty({
    description: 'The address where the board is located in the rack',
    example: '057',
  })
  @IsOptional()
  @IsString()
  addressing?: string;
}
