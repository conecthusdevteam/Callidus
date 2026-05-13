import { IsNumber, IsString } from 'class-validator';

export class CreatePlateWashDto {
  @IsString()
  operator!: string;

  @IsNumber()
  shift!: number;

  @IsNumber()
  phase!: number;
}
