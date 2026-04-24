import { Request } from 'express';
import { CurrentUserPayload } from './current-user-payload.interface';

export interface AuthenticatedRequest extends Request {
  user: CurrentUserPayload;
}
