import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CautelaStatus } from '../../common/enums/cautela-status.enum';

export class ListCautelasDto {
  @IsOptional()
  @IsEnum(CautelaStatus)
  status?: CautelaStatus;

  @IsOptional()
  @IsUUID()
  setorId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  updatedSince?: string;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  respondidas?: boolean;
}
