import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { DriverService } from '../driver/driver.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private driverService: DriverService,
    private jwtService: JwtService,
  ) {}

  async registerUser(userData: any) {
    const existingUser = await this.userService.findOneByEmail(userData.email);
    if (existingUser) throw new ConflictException('User already exists');

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.userService.create({ ...userData, password: hashedPassword });
    return this.login(user, 'user');
  }

  async loginUser(email: string, pass: string) {
    const user = await this.userService.findOneByEmail(email);
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.login(user, 'user');
  }

  async registerDriver(driverData: any) {
    const existingDriver = await this.driverService.findOneByEmail(driverData.email);
    if (existingDriver) throw new ConflictException('Driver already exists');

    const hashedPassword = await bcrypt.hash(driverData.password, 10);
    const driver = await this.driverService.create({ ...driverData, password: hashedPassword });
    return this.login(driver, 'driver');
  }

  async loginDriver(email: string, pass: string) {
    const driver = await this.driverService.findOneByEmail(email);
    if (!driver || !(await bcrypt.compare(pass, driver.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.login(driver, 'driver');
  }

  private async login(user: any, role: string) {
    const payload = { email: user.email, sub: user._id, role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
