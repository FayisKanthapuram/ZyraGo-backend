import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('user/register')
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Post('user/login')
  async loginUser(@Body() loginDto: LoginDto) {
    return this.authService.loginUser(loginDto.email, loginDto.password);
  }

  @Post('driver/register')
  async registerDriver(@Body() registerDriverDto: RegisterDriverDto) {
    return this.authService.registerDriver(registerDriverDto);
  }

  @Post('driver/login')
  async loginDriver(@Body() loginDto: LoginDto) {
    return this.authService.loginDriver(loginDto.email, loginDto.password);
  }
}
