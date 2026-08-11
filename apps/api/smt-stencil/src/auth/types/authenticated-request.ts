import type { Request } from 'express';
import type { UserArea, UserRole } from '../../users/entities/user.entity';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  name: string;
  area: UserArea;
  role: UserRole;
}

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
