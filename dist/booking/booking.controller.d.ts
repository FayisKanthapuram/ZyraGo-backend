import { BookingService } from './booking.service';
import { DriverService } from '../driver/driver.service';
export declare class BookingController {
    private readonly bookingService;
    private readonly driverService;
    constructor(bookingService: BookingService, driverService: DriverService);
    create(bookingData: any, req: any): Promise<import("./schemas/booking.schema").BookingDocument>;
    match(id: string): Promise<import("./schemas/booking.schema").BookingDocument>;
}
