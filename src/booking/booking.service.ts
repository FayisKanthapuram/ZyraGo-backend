import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { DriverService } from '../driver/driver.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly driverService: DriverService,
  ) {}

  async create(bookingData: Partial<Booking>): Promise<BookingDocument> {
    const createdBooking = new this.bookingModel(bookingData);
    return createdBooking.save();
  }

  async findById(id: string): Promise<BookingDocument | null> {
    return this.bookingModel.findById(id).exec();
  }

  async matchDriver(bookingId: string): Promise<BookingDocument | null> {
    const booking = await this.findById(bookingId);
    if (!booking || booking.status !== 'requested') {
      return null;
    }

    const availableDrivers = await this.driverService.findAvailableDrivers();
    if (availableDrivers.length === 0) {
      return null; // No drivers available
    }

    let nearestDriver: any = null;
    let minDistance = Infinity;

    for (const driver of availableDrivers) {
      if (booking.rejectedDrivers.includes(driver._id as any)) {
        continue;
      }
      
      const d = driver as any;
      const dist = this.calculateDistance(
        booking.pickupLocation.lat,
        booking.pickupLocation.lng,
        d.location.lat,
        d.location.lng,
      );

      if (dist < minDistance) {
        minDistance = dist;
        nearestDriver = driver;
      }
    }

    if (!nearestDriver) {
      return null; // All available drivers have rejected
    }

    booking.driver = nearestDriver._id as any;
    booking.status = 'assigned';
    await booking.save();

    await this.driverService.updateStatus(nearestDriver._id.toString(), 'busy');

    return booking;
  }

  async acceptBooking(bookingId: string, driverId: string): Promise<BookingDocument> {
    const booking = await this.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.driver?.toString() !== driverId) throw new ForbiddenException('You are not authorized to update this booking');
    if (booking.status !== 'assigned') throw new BadRequestException(`Cannot accept booking in ${booking.status} state`);

    booking.status = 'accepted';
    return booking.save();
  }

  async rejectBooking(bookingId: string, driverId: string): Promise<BookingDocument> {
    const booking = await this.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.driver?.toString() !== driverId) throw new ForbiddenException('You are not authorized to reject this booking');
    if (booking.status !== 'assigned') throw new BadRequestException(`Cannot reject booking in ${booking.status} state`);

    await this.driverService.updateStatus(driverId, 'available');

    // Add driver to rejected array and set back to requested
    booking.rejectedDrivers.push(driverId as any);
    booking.driver = null as any;
    booking.status = 'requested';
    return booking.save();
  }

  async startTrip(bookingId: string, driverId: string): Promise<BookingDocument> {
    const booking = await this.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.driver?.toString() !== driverId) throw new ForbiddenException('You are not authorized to start this booking');
    if (booking.status !== 'accepted') throw new BadRequestException(`Cannot start trip in ${booking.status} state`);

    booking.status = 'ongoing';
    return booking.save();
  }

  async completeTrip(bookingId: string, driverId: string): Promise<BookingDocument> {
    const booking = await this.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.driver?.toString() !== driverId) throw new ForbiddenException('You are not authorized to complete this booking');
    if (booking.status !== 'ongoing') throw new BadRequestException(`Cannot complete trip in ${booking.status} state`);

    booking.status = 'completed';
    return booking.save();
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
