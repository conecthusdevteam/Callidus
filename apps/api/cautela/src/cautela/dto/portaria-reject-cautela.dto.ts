import { IsOptional, IsString } from 'class-validator';

export class PortariaRejectCautelaDto {
  @IsOptional()
  @IsString()
  justificativa?: string;
}
