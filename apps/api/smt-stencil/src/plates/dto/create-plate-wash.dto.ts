import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreatePlateWashDto {
  @ApiProperty({
    description: 'The ID of the plate to be washed',
    example: 'plate_SOypWQVWYl1XUGKRyAZyV',
  })
  @IsString()
  plateId!: string;

  @ApiProperty({
    description: 'The name of the operator performing the wash',
    example: 'John Doe',
  })  
  @IsString()
  operator!: string;

  @ApiProperty({
    description: 'The shift during which the wash is performed',
    example: 1,
  })
  @IsNumber()
  shift!: number;
  
  @ApiProperty({
    description: 'The phase of the wash process',
    example: 2,
  })
  @IsNumber()
  phase!: number;
}
