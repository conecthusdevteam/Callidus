import { IsNotEmpty, IsString } from 'class-validator';

export class RejectCautelaDto {
  @IsString()
  @IsNotEmpty()
  justificativa: string;
}
