import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { CurrentUserPayload } from '../common/interfaces/current-user-payload.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  @Post('logout')
  logout(
    @CurrentUser() user: CurrentUserPayload,
    @Body() logoutDto: LogoutDto,
  ) {
    return this.authService.logout(user, logoutDto);
  }

  @Post('logout-all')
  logoutAll(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.logoutAll(user);
  }
}
