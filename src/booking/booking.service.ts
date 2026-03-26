import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';

@Injectable()
export class BookingService {
  constructor(@InjectModel(Booking.name) private bookingModel: Model<BookingDocument>) {}

  async create(bookingData: any): Promise<BookingDocument> {
    const createdBooking = new this.bookingModel(bookingData);
    return createdBooking.save();
  }

  async findById(id: string): Promise<BookingDocument | null> {
    return this.bookingModel.findById(id).exec();
  }

  async matchDriver(bookingId: string, availableDrivers: any[], excludedDriverIds: string[] = []): Promise<BookingDocument | null> {
    const booking = await this.findById(bookingId);
    if (!booking || booking.status !== 'requested') return null;

    let nearestDriver: any = null;
    let minDistance = Infinity;

    for (const driver of availableDrivers) {
      if (excludedDriverIds.includes(driver._id.toString())) continue;
      const d = driver as any;
      const dist = this.calculateDistance(
        booking.pickupLocation.lat,
        booking.pickupLocation.lng,
        d.location.lat,
        d.location.lng,
      );

      if (dist < minDistance) {
        minDistance = dist;
        nearestDriver = d;
      }
    }

    if (nearestDriver) {
      booking.driver = nearestDriver._id;
      booking.status = 'assigned';
      await booking.save();
      return booking;
    }

    return null;
  }

  async acceptBooking(bookingId: string, driverId: string): Promise<BookingDocument | null> {
    const booking = await this.findById(bookingId);
    if (!booking || booking.status !== 'assigned' || booking.driver.toString() !== driverId) {
      return null;
    }

    booking.status = 'accepted';
    return booking.save();
  }

  async rejectBooking(bookingId: string, driverId: string): Promise<BookingDocument | null> {
    const booking = await this.findById(bookingId);
    if (!booking || booking.status !== 'assigned' || booking.driver.toString() !== driverId) {
      return null;
    }

    // Add driver to rejected array and set back to requested
    booking.rejectedDrivers.push(driverId as any);
    booking.driver = null as any;
    booking.status = 'requested';
    return booking.save();
  }

  async startTrip(bookingId: string, driverId: string): Promise<BookingDocument | null> {
    const booking = await this.findById(bookingId);
    if (!booking || booking.status !== 'accepted' || booking.driver.toString() !== driverId) {
      return null;
    }

    booking.status = 'ongoing';
    return booking.save();
  }

  async completeTrip(bookingId: string, driverId: string): Promise<BookingDocument | null> {
    const booking = await this.findById(bookingId);
    if (!booking || booking.status !== 'ongoing' || booking.driver.toString() !== driverId) {
      return null;
    }

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
