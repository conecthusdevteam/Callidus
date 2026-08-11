import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './types/authenticated-request';

const REFRESH_COOKIE_NAME = 'smt_refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setRefreshCookie(response, session.refreshToken);
    return session;
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.refresh(
      dto.refreshToken ?? this.getCookie(request, REFRESH_COOKIE_NAME),
    );
    this.setRefreshCookie(response, session.refreshToken);
    return session;
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (request.user?.sub) {
      await this.authService.logout(request.user.sub);
    } else {
      await this.authService.logoutByRefreshToken(
        dto.refreshToken ?? this.getCookie(request, REFRESH_COOKIE_NAME),
      );
    }
    response.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
  }

  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, this.cookieOptions());
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'hml' || process.env.NODE_ENV === 'prod',
      path: '/auth',
    };
  }

  private getCookie(request: Request, name: string) {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return undefined;

    return cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.split('=')
      .slice(1)
      .join('=');
  }
}
