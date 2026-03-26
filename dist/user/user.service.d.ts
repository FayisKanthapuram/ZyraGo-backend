import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
export declare class UserService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(userData: any): Promise<UserDocument>;
    findOneByEmail(email: string): Promise<UserDocument | null>;
}
