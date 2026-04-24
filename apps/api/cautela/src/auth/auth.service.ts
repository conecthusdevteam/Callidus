import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUserPayload } from '../common/interfaces/current-user-payload.interface';
import { PasswordService } from '../common/security/password.service';
import { TokenService } from '../common/security/token.service';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });

    if (
      !user ||
      !user.ativo ||
      !this.passwordService.compare(loginDto.senha, user.senhaHash)
    ) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    return this.issueTokenPair(user);
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    let payload: ReturnType<TokenService['verifyRefreshToken']>;

    try {
      payload = this.tokenService.verifyRefreshToken(refreshTokenDto.refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.ativo) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo.');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Sua sessão não é mais válida.');
    }

    if (
      !this.passwordService.compare(
        refreshTokenDto.refreshToken,
        user.refreshTokenHash,
      )
    ) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    if (
      user.refreshTokenExpiresAt &&
      user.refreshTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Refresh token expirado.');
    }

    return this.issueTokenPair(user);
  }

  async logout(currentUser: CurrentUserPayload, _logoutDto: LogoutDto) {
    const user = await this.usersRepository.findOne({
      where: { id: currentUser.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário autenticado não encontrado.');
    }

    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;

    await this.usersRepository.save(user);

    return { message: 'Sessão encerrada com sucesso.' };
  }

  async logoutAll(currentUser: CurrentUserPayload) {
    const user = await this.usersRepository.findOne({
      where: { id: currentUser.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário autenticado não encontrado.');
    }

    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    user.tokenVersion += 1;

    await this.usersRepository.save(user);

    return { message: 'Todas as sessões foram encerradas.' };
  }

  private async issueTokenPair(user: User) {
    const payload: CurrentUserPayload = {
      email: user.email,
      papel: user.papel,
      sub: user.id,
      tokenVersion: user.tokenVersion,
    };
    const tokens = this.tokenService.generateTokenPair(payload);

    user.refreshTokenHash = this.passwordService.hash(tokens.refreshToken);
    user.refreshTokenExpiresAt = this.tokenService.getRefreshTokenExpiryDate();

    const savedUser = await this.usersRepository.save(user);

    return {
      ...tokens,
      user: {
        ativo: savedUser.ativo,
        atualizadoEm: savedUser.atualizadoEm,
        criadoEm: savedUser.criadoEm,
        email: savedUser.email,
        id: savedUser.id,
        nome: savedUser.nome,
        papel: savedUser.papel,
      },
    };
  }
}
