import {
  ForbiddenException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './types/authenticated-request';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

const REFRESH_SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.usersService.ensureBootstrapUser();
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials.');

    this.assertCanAttemptLogin(user);

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      await this.recordFailedAttempt(user);
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.area !== dto.area && user.area !== 'admin') {
      await this.recordFailedAttempt(user);
      throw new ForbiddenException('User is not allowed in this area.');
    }

    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();

    const session = await this.createSession(user, dto.rememberMe === true);
    await this.usersService.save(user);

    return session;
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing.');

    const { sub } = await this.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findById(sub);

    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      await this.clearRefreshToken(user);
      throw new UnauthorizedException('Refresh token expired.');
    }

    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenMatches) throw new UnauthorizedException('Invalid refresh token.');

    const session = await this.createSession(user, true);
    await this.usersService.save(user);

    return session;
  }

  async logout(userId: string) {
    const user = await this.usersService.findById(userId);
    if (user) await this.clearRefreshToken(user);
  }

  async logoutByRefreshToken(refreshToken: string | undefined) {
    if (!refreshToken) return;

    try {
      const { sub } = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );
      const user = await this.usersService.findById(sub);
      if (user) await this.clearRefreshToken(user);
    } catch {
      return;
    }
  }

  sanitizeUser(user: User): AuthenticatedUser {
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      area: user.area,
      role: user.role,
    };
  }

  private async createSession(user: User, rememberMe: boolean) {
    const payload = this.sanitizeUser(user);
    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresIn as never,
    });

    const refreshDays = rememberMe
      ? Number(this.configService.get<string>('JWT_REFRESH_REMEMBER_DAYS') ?? 30)
      : Number(this.configService.get<string>('JWT_REFRESH_DAYS') ?? 7);
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        jti: randomUUID(),
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: `${refreshDays}d` as never,
      },
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, REFRESH_SALT_ROUNDS);
    user.refreshTokenExpiresAt = this.daysFromNow(refreshDays);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
      user: payload,
    };
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  private assertCanAttemptLogin(user: User) {
    if (!user.isActive) {
      throw new ForbiddenException('User is inactive.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('User temporarily locked.');
    }
  }

  private async recordFailedAttempt(user: User) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.loginAttempts = 0;
    }

    await this.usersService.save(user);
  }

  private async clearRefreshToken(user: User) {
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await this.usersService.save(user);
  }

  private daysFromNow(days: number) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
