import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from './schemas/driver.schema';

@Injectable()
export class DriverService {
  constructor(@InjectModel(Driver.name) private driverModel: Model<DriverDocument>) {}

  async create(driverData: any): Promise<DriverDocument> {
    const createdDriver = new this.driverModel(driverData);
    return createdDriver.save();
  }

  async findOneByEmail(email: string): Promise<DriverDocument | null> {
    return this.driverModel.findOne({ email }).select('+password').exec();
  }

  async findAvailableDrivers(): Promise<DriverDocument[]> {
    return this.driverModel.find({ status: 'available' }).exec();
  }

  async updateStatus(driverId: string, status: string): Promise<DriverDocument | null> {
    return this.driverModel.findByIdAndUpdate(driverId, { status }, { new: true }).exec();
  }
}
