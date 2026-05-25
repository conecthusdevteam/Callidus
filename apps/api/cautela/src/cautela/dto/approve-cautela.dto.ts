import { IsEnum, IsOptional } from 'class-validator';
import { CautelaPermissionType } from '../../common/enums/cautela-permission-type.enum';

export class ApproveCautelaDto {
  @IsEnum(CautelaPermissionType)
  @IsOptional()
  tipoPermissao?: CautelaPermissionType;
}
