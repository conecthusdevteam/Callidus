import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSectorDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numeroSetor: number;

  @IsString()
  nome: string;

  @IsUUID()
  gestorId: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
