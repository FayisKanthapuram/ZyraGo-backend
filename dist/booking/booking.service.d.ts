import { Model } from 'mongoose';
import { BookingDocument } from './schemas/booking.schema';
export declare class BookingService {
    private bookingModel;
    constructor(bookingModel: Model<BookingDocument>);
    create(bookingData: any): Promise<BookingDocument>;
    findById(id: string): Promise<BookingDocument | null>;
    matchDriver(bookingId: string, availableDrivers: any[]): Promise<BookingDocument | null>;
    private calculateDistance;
}
