import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { DriverService } from '../driver/driver.service';
export declare class AuthService {
    private userService;
    private driverService;
    private jwtService;
    constructor(userService: UserService, driverService: DriverService, jwtService: JwtService);
    registerUser(userData: any): Promise<{
        access_token: string;
    }>;
    loginUser(email: string, pass: string): Promise<{
        access_token: string;
    }>;
    registerDriver(driverData: any): Promise<{
        access_token: string;
    }>;
    loginDriver(email: string, pass: string): Promise<{
        access_token: string;
    }>;
    private login;
}
