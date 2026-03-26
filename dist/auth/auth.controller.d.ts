import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    registerUser(userData: any): Promise<{
        access_token: string;
    }>;
    loginUser(body: any): Promise<{
        access_token: string;
    }>;
    registerDriver(driverData: any): Promise<{
        access_token: string;
    }>;
    loginDriver(body: any): Promise<{
        access_token: string;
    }>;
}
