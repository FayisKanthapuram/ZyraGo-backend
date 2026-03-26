import { Controller, Post, Body, UseGuards, Request, Patch, Param, NotFoundException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { DriverService } from '../driver/driver.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('booking')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly driverService: DriverService,
  ) {}

  @Post()
  async create(@Body() bookingData: any, @Request() req) {
    return this.bookingService.create({
      ...bookingData,
      user: req.user.userId,
      status: 'requested',
    });
  }

  @Patch(':id/match')
  async match(@Param('id') id: string) {
    const availableDrivers = await this.driverService.findAvailableDrivers();
    if (availableDrivers.length === 0) {
      throw new NotFoundException('No available drivers found');
    }

    const bookingToMatch = await this.bookingService.findById(id);
    if (!bookingToMatch) throw new NotFoundException('Booking not found');

    const excludedIds = bookingToMatch.rejectedDrivers ? bookingToMatch.rejectedDrivers.map(d => d.toString()) : [];
    const booking = await this.bookingService.matchDriver(id, availableDrivers, excludedIds);
    if (!booking) {
      throw new NotFoundException('Booking not able to be assigned. Might need more available drivers.');
    }

    // Update driver status to busy
    await this.driverService.updateStatus(booking.driver.toString(), 'busy');

    return booking;
  }

  @Patch(':id/accept')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async accept(@Param('id') id: string, @Request() req) {
    const booking = await this.bookingService.acceptBooking(id, req.user.userId);
    if (!booking) {
      throw new NotFoundException('Booking not found or you are not authorized to accept it.');
    }
    return booking;
  }

  @Patch(':id/reject')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async reject(@Param('id') id: string, @Request() req) {
    const booking = await this.bookingService.rejectBooking(id, req.user.userId);
    if (!booking) {
      throw new NotFoundException('Booking not found or you are not authorized to reject it.');
    }

    // Free up the rejecting driver
    await this.driverService.updateStatus(req.user.userId, 'available');

    // Trigger match for the next driver
    return this.match(id);
  }

  @Patch(':id/start')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async startTrip(@Param('id') id: string, @Request() req) {
    const booking = await this.bookingService.startTrip(id, req.user.userId);
    if (!booking) {
      throw new NotFoundException('Booking not found, not in accepted state, or you are not authorized.');
    }
    return booking;
  }

  @Patch(':id/complete')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async completeTrip(@Param('id') id: string, @Request() req) {
    const booking = await this.bookingService.completeTrip(id, req.user.userId);
    if (!booking) {
      throw new NotFoundException('Booking not found, not in ongoing state, or you are not authorized.');
    }

    // Free up the driver
    await this.driverService.updateStatus(req.user.userId, 'available');

    return booking;
  }
}
