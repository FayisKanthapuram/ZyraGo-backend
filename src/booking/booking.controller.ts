import { Controller, Post, Body, UseGuards, Request, Patch, Param, NotFoundException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { DriverService } from '../driver/driver.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('booking')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly driverService: DriverService,
  ) {}

  @Post()
  @Roles('user')
  @UseGuards(RolesGuard)
  async create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    return this.bookingService.create({
      ...createBookingDto,
      user: req.user.userId,
      status: 'requested',
    });
  }

  @Patch(':id/match')
  @Roles('user')
  @UseGuards(RolesGuard)
  async match(@Param('id') id: string) {
    const availableDrivers = await this.driverService.findAvailableDrivers();
    if (availableDrivers.length === 0) {
      throw new NotFoundException('No available drivers found');
    }

    const booking = await this.bookingService.matchDriver(id);
    if (!booking) {
      throw new NotFoundException('Booking not found or no available drivers');
    }
    return booking;
  }

  @Patch(':id/accept')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async acceptBooking(@Param('id') id: string, @Request() req) {
    return this.bookingService.acceptBooking(id, req.user.userId);
  }

  @Patch(':id/reject')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async rejectBooking(@Param('id') id: string, @Request() req) {
    await this.bookingService.rejectBooking(id, req.user.userId);
    // Trigger match for the next driver
    return this.match(id);
  }

  @Patch(':id/start')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async startTrip(@Param('id') id: string, @Request() req) {
    return this.bookingService.startTrip(id, req.user.userId);
  }

  @Patch(':id/complete')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async completeTrip(@Param('id') id: string, @Request() req) {
    const booking = await this.bookingService.completeTrip(id, req.user.userId);
    
    // Free up the driver
    await this.driverService.updateStatus(req.user.userId, 'available');

    return booking;
  }
}
