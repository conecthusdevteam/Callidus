import { UserRole } from '../enums/user-role.enum';

export interface CurrentUserPayload {
  email: string;
  papel: UserRole;
  sub: string;
  tokenVersion: number;
}
