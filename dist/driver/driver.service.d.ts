import { Model } from 'mongoose';
import { DriverDocument } from './schemas/driver.schema';
export declare class DriverService {
    private driverModel;
    constructor(driverModel: Model<DriverDocument>);
    create(driverData: any): Promise<DriverDocument>;
    findOneByEmail(email: string): Promise<DriverDocument | null>;
    findAvailableDrivers(): Promise<DriverDocument[]>;
    updateStatus(driverId: string, status: string): Promise<DriverDocument | null>;
}
