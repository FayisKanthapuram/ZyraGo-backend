import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from './schemas/driver.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class DriverService {
  constructor(
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

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
    return this.driverModel.findByIdAndUpdate(driverId, { status }, { returnDocument: 'after' }).exec();
  }

  async updateLocation(driverId: string, lat: number, lng: number, serviceRadius?: number): Promise<DriverDocument | null> {
    const updateData: any = { location: { lat, lng } };
    if (serviceRadius !== undefined) {
      updateData.serviceRadius = serviceRadius;
    }
    const driver = await this.driverModel.findByIdAndUpdate(driverId, { $set: updateData }, { returnDocument: 'after' }).exec();
    return driver;
  }

  async findById(id: string): Promise<DriverDocument | null> {
    return this.driverModel.findById(id).exec();
  }
}
