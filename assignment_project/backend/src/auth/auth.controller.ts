/**
 * Auth Controller
 * POST /auth/login — Admin login
 * POST /auth/refresh — Refresh access token
 * POST /auth/logout — Logout (client-side token removal)
 */
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    const result = await this.authService.refresh(refreshToken);
    return {
      success: true,
      data: result,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    // JWT is stateless — logout is handled client-side by removing tokens
    return {
      success: true,
      data: { message: 'Logged out successfully' },
    };
  }
}
