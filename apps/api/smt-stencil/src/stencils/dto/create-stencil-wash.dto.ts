import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateStencilWashDto {
  @IsString()
  operator!: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
