import { Controller, Post, Body, UseGuards, Request, Patch, Param, NotFoundException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { DriverService } from '../driver/driver.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

    const booking = await this.bookingService.matchDriver(id, availableDrivers);
    if (!booking) {
      throw new NotFoundException('Booking not found or already assigned');
    }

    // Update driver status to busy
    await this.driverService.updateStatus(booking.driver.toString(), 'busy');

    return booking;
  }
}
