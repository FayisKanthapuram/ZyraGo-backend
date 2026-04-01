import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { DriverService } from '../driver/driver.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly driverService: DriverService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(bookingData: Partial<Booking>): Promise<BookingDocument> {
    if (!bookingData.startTime) {
      throw new BadRequestException('Start time is required for scheduled bookings');
    }

    const scheduledTime = new Date(bookingData.startTime);
    if (isNaN(scheduledTime.getTime())) {
      throw new BadRequestException('Invalid start time format');
    }

    const thirtyMinsFromNow = new Date(Date.now() + 30 * 60 * 1000);
    if (scheduledTime < thirtyMinsFromNow) {
      throw new BadRequestException('Scheduled time must be at least 30 minutes in advance');
    }
    
    // Ensure Date object is stored
    bookingData.startTime = scheduledTime;
    
    // Generate a 4-digit OTP
    bookingData.otp = Math.floor(1000 + Math.random() * 9000).toString();

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

    // Notify rider and new driver via socket
    const updatedBooking = await this.bookingModel.findById(booking._id).populate('driver', 'name phone').exec();
    this.realtimeGateway.emitBookingUpdate(booking._id.toString(), 'bookingUpdated', updatedBooking);
    
    return updatedBooking;
  }

  async acceptBooking(bookingId: string, driverId: string): Promise<BookingDocument> {
    const booking = await this.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.driver?.toString() !== driverId) throw new ForbiddenException('You are not authorized to update this booking');
    if (booking.status !== 'assigned') throw new BadRequestException(`Cannot accept booking in ${booking.status} state`);

    booking.status = 'accepted';
    const savedBooking = await booking.save();
    
    // Notify party
    this.realtimeGateway.emitBookingUpdate(bookingId, 'bookingUpdated', savedBooking);
    
    return savedBooking;
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
    const savedBooking = await booking.save();

    // Notify user
    this.realtimeGateway.emitBookingUpdate(bookingId, 'bookingUpdated', savedBooking);

    return savedBooking;
  }

  async cancelBooking(bookingId: string, userId: string): Promise<BookingDocument> {
    const booking = await this.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user?.toString() !== userId) throw new ForbiddenException('You are not authorized to cancel this booking');
    
    if (['completed', 'cancelled'].includes(booking.status)) {
      throw new BadRequestException(`Cannot cancel a booking that is currently ${booking.status}`);
    }

    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    if (new Date(booking.startTime) < oneHourFromNow) {
      throw new BadRequestException('Bookings can only be cancelled at least 1 hour before the scheduled start time');
    }

    if (booking.driver && ['assigned', 'accepted'].includes(booking.status)) {
      await this.driverService.updateStatus(booking.driver.toString(), 'available');
    }

    booking.status = 'cancelled';
    const savedBooking = await booking.save();

    this.realtimeGateway.emitBookingUpdate(bookingId, 'bookingUpdated', savedBooking);

    return savedBooking;
  }

  async arriveAtLocation(bookingId: string, driverId: string): Promise<BookingDocument> {
    const booking = await this.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.driver?.toString() !== driverId) throw new ForbiddenException('You are not assigned to this booking');
    if (booking.status !== 'accepted') throw new BadRequestException('Booking is not in accepted status');

    const tenMinsBeforeStart = new Date(booking.startTime).getTime() - 10 * 60 * 1000;
    if (Date.now() < tenMinsBeforeStart) {
      throw new BadRequestException('You can only arrive within 10 minutes of the scheduled start time');
    }

    booking.status = 'arrived';
    const savedBooking = await booking.save();

    // Broadcast update so user sees driver has arrived and the OTP
    this.realtimeGateway.emitBookingUpdate(bookingId, 'bookingUpdated', savedBooking);

    return savedBooking;
  }

  async startTrip(bookingId: string, driverId: string, otp: string): Promise<BookingDocument> {
    const booking = await this.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.driver?.toString() !== driverId) throw new ForbiddenException('You are not authorized to start this booking');
    if (booking.status !== 'arrived') throw new BadRequestException('Booking is not in arrived status or already started');
    
    if (booking.otp !== otp) {
      throw new BadRequestException('Invalid OTP. Please check with the passenger.');
    }

    booking.status = 'ongoing';
    const savedBooking = await booking.save();

    // Notify user
    this.realtimeGateway.emitBookingUpdate(bookingId, 'bookingUpdated', savedBooking);

    return savedBooking;
  }

  async completeTrip(bookingId: string, driverId: string): Promise<BookingDocument> {
    const booking = await this.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.driver?.toString() !== driverId) throw new ForbiddenException('You are not authorized to complete this booking');
    if (booking.status !== 'ongoing') throw new BadRequestException(`Cannot complete trip in ${booking.status} state`);

    booking.status = 'completed';
    booking.completedAt = new Date();
    // Calculate fare: base ₹50 + ₹15/min (or use scheduled duration logic)
    booking.fare = 50 + (booking.duration * 15);
    booking.paymentStatus = 'pending';
    const savedBooking = await booking.save();

    // Free the driver
    await this.driverService.updateStatus(driverId, 'available');

    // Notify rider and driver
    this.realtimeGateway.emitBookingUpdate(bookingId, 'bookingUpdated', savedBooking);

    return savedBooking;
  }

  async updateDriverLocation(bookingId: string, driverId: string, lat: number, lng: number): Promise<void> {
    const booking = await this.findById(bookingId);
    if (!booking || booking.driver?.toString() !== driverId || booking.status !== 'ongoing') {
      return; // Only allow updates for valid, ongoing trips
    }

    // Save location to driver profile (optional, but good for persistence)
    await this.driverService.updateLocation(driverId, lat, lng);

    // Emit via WebSocket to ONLY this booking's room
    this.realtimeGateway.emitBookingUpdate(bookingId, 'driverLocationUpdated', {
      driverId,
      location: { lat, lng },
    });
  }

  // Rate a completed booking
  async rateBooking(bookingId: string, userId: string, rating: number, comment?: string): Promise<BookingDocument> {
    const booking = await this.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user?.toString() !== userId) throw new ForbiddenException('Only the rider can rate');
    if (booking.status !== 'completed') throw new BadRequestException('Can only rate completed bookings');

    booking.rating = rating;
    if (comment) booking.ratingComment = comment;
    return booking.save();
  }

  // Simulate payment
  async processPayment(bookingId: string, userId: string): Promise<BookingDocument> {
    const booking = await this.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user?.toString() !== userId) throw new ForbiddenException('Only the rider can pay');
    if (booking.status !== 'completed') throw new BadRequestException('Can only pay for completed bookings');
    if (booking.paymentStatus === 'paid') throw new BadRequestException('Already paid');

    booking.paymentStatus = 'paid';
    return booking.save();
  }

  async getUpcomingBookingsForUser(userId: string): Promise<BookingDocument[]> {
    return this.bookingModel.find({
      user: userId as any,
      status: { $in: ['requested', 'assigned', 'accepted', 'arrived', 'ongoing'] },
    }).populate('driver', 'name phone').sort({ startTime: 1 }).exec();
  }

  async getUpcomingBookingsForDriver(driverId: string): Promise<BookingDocument[]> {
    return this.bookingModel.find({
      driver: driverId as any,
      status: { $in: ['assigned', 'accepted', 'arrived', 'ongoing'] },
    }).populate('user', 'name phone').sort({ startTime: 1 }).exec();
  }

  // Get recently completed booking that needs payment/rating (for post-trip flow)
  async findRecentCompletedForUser(userId: string): Promise<BookingDocument | null> {
    return this.bookingModel.findOne({
      user: userId as any,
      status: 'completed',
      paymentStatus: 'pending',
    }).populate('driver', 'name phone').sort({ completedAt: -1 }).exec();
  }

  // Booking history for rider
  async getUserHistory(userId: string): Promise<BookingDocument[]> {
    return this.bookingModel.find({
      user: userId as any,
      status: 'completed',
    }).populate('driver', 'name phone').sort({ completedAt: -1 }).limit(50).exec();
  }

  // Booking history for driver (earnings)
  async getDriverHistory(driverId: string): Promise<BookingDocument[]> {
    return this.bookingModel.find({
      driver: driverId as any,
      status: 'completed',
    }).populate('user', 'name phone').sort({ completedAt: -1 }).limit(50).exec();
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
