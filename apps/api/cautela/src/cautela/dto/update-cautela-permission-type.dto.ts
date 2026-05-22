import { IsEnum } from 'class-validator';
import { CautelaPermissionType } from '../../common/enums/cautela-permission-type.enum';

export class UpdateCautelaPermissionTypeDto {
  @IsEnum(CautelaPermissionType)
  tipoPermissao: CautelaPermissionType;
}
