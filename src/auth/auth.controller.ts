import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('user/register')
  async registerUser(@Body() userData: any) {
    return this.authService.registerUser(userData);
  }

  @Post('user/login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Body() body: any) {
    return this.authService.loginUser(body.email, body.password);
  }

  @Post('driver/register')
  async registerDriver(@Body() driverData: any) {
    return this.authService.registerDriver(driverData);
  }

  @Post('driver/login')
  @HttpCode(HttpStatus.OK)
  async loginDriver(@Body() body: any) {
    return this.authService.loginDriver(body.email, body.password);
  }
}
