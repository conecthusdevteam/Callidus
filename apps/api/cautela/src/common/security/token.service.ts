import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { CurrentUserPayload } from '../interfaces/current-user-payload.interface';

type JwtSignOptions = {
  expiresIn: string;
};

type JwtVerifyOptions = {
  ignoreExpiration?: boolean;
};

type JwtModuleLike = {
  sign: <T extends object>(
    payload: T,
    secret: string,
    options: JwtSignOptions,
  ) => string;
  verify: (
    token: string,
    secret: string,
    options?: JwtVerifyOptions,
  ) => unknown;
};

const jwt = require('jsonwebtoken') as JwtModuleLike;

export type TokenPair = {
  accessToken: string;
  accessTokenExpiresIn: string;
  refreshToken: string;
  refreshTokenExpiresIn: string;
};

type RefreshTokenPayload = CurrentUserPayload & {
  jti: string;
  type: 'refresh';
};

@Injectable()
export class TokenService {
  constructor(private readonly configService: ConfigService) {}

  generateTokenPair(payload: CurrentUserPayload): TokenPair {
    const accessTokenExpiresIn = this.getAccessTokenExpiration();
    const refreshTokenExpiresIn = this.getRefreshTokenExpiration();

    const accessToken = jwt.sign(payload, this.getSecret(), {
      expiresIn: accessTokenExpiresIn,
    });
    const refreshToken = jwt.sign(
      {
        ...payload,
        jti: randomUUID(),
        type: 'refresh',
      },
      this.getSecret(),
      { expiresIn: refreshTokenExpiresIn },
    );

    return {
      accessToken,
      accessTokenExpiresIn,
      refreshToken,
      refreshTokenExpiresIn,
    };
  }

  verifyAccessToken(token: string): CurrentUserPayload {
    return jwt.verify(token, this.getSecret()) as unknown as CurrentUserPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, this.getSecret()) as unknown as RefreshTokenPayload;
  }

  getRefreshTokenExpiryDate(): Date {
    return this.buildExpirationDate(this.getRefreshTokenExpiration());
  }

  getAccessTokenExpiryDate(): Date {
    return this.buildExpirationDate(this.getAccessTokenExpiration());
  }

  private getSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'cautela-dev-secret';
  }

  private getAccessTokenExpiration(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
  }

  private getRefreshTokenExpiration(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  private buildExpirationDate(value: string): Date {
    const match = value.match(/^(\d+)([smhd])$/i);

    if (!match) {
      return new Date(Date.now() + 15 * 60 * 1000);
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier =
      unit === 's'
        ? 1_000
        : unit === 'm'
          ? 60_000
          : unit === 'h'
            ? 3_600_000
            : 86_400_000;

    return new Date(Date.now() + amount * multiplier);
  }
}
