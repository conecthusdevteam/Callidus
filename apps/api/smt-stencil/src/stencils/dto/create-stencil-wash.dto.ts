import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateStencilWashDto {
  @ApiProperty({
    description: 'The ID of the stencil to be washed',
    example: 'stencil_SOypWQVWYl1XUGKRyAZyV',
  })
  @IsString()
  stencilId!: string;

  @ApiProperty({
    description: 'The name of the operator performing the wash',
    example: 'John Doe',
  })
  @IsString()
  operator!: string;

  @ApiProperty({
    description: 'The date and time when the wash was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
