import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserArea } from '../../users/entities/user.entity';

export class LoginDto {
  @IsEnum(UserArea)
  area!: UserArea;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
