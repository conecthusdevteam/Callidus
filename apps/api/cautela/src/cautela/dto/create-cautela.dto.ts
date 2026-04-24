import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateCautelaItemDto {
  @IsString()
  @IsNotEmpty()
  nomeItem: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade: number;
}

export class CreateCautelaDto {
  @IsUUID()
  setorId: string;

  @IsString()
  @IsNotEmpty()
  proprietarioNome: string;

  @IsEmail()
  proprietarioEmail: string;

  @IsBoolean()
  retornoItem: boolean;

  @ValidateIf((dto: CreateCautelaDto) => dto.retornoItem)
  @IsDateString()
  validade?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCautelaItemDto)
  itens: CreateCautelaItemDto[];
}
