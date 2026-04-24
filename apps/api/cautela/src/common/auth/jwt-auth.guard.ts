import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { User } from '../../user/entities/user.entity';
import { TokenService } from '../security/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token de acesso não informado.');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Cabeçalho Authorization inválido.');
    }

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.ativo) {
        throw new UnauthorizedException('Usuário inválido ou inativo.');
      }

      if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Sua sessão não é mais válida.');
      }

      (request as Request & { user: typeof payload }).user = {
        email: user.email,
        papel: user.papel,
        sub: user.id,
        tokenVersion: user.tokenVersion,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado.');
    }
  }
}
