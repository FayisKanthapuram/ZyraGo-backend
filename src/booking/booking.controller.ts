import { Controller, Post, Body, UseGuards, Request, Patch, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { DriverService } from '../driver/driver.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('Booking')
@ApiBearerAuth('JWT-auth')
@Controller('booking')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly driverService: DriverService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking (User only)' })
  @ApiResponse({ status: 201, description: 'Booking created with status "requested"' })
  @ApiResponse({ status: 403, description: 'Forbidden — only users can create bookings' })
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
  @ApiOperation({ summary: 'Match nearest available driver to booking (User only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Driver matched and booking status set to "assigned"' })
  @ApiResponse({ status: 404, description: 'No available drivers or booking not found' })
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
  @ApiOperation({ summary: 'Accept assigned booking (Driver only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking accepted, status set to "accepted"' })
  @ApiResponse({ status: 403, description: 'Not the assigned driver' })
  @ApiResponse({ status: 400, description: 'Booking not in "assigned" state' })
  @Roles('driver')
  @UseGuards(RolesGuard)
  async acceptBooking(@Param('id') id: string, @Request() req) {
    return this.bookingService.acceptBooking(id, req.user.userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject booking and auto-reassign to next driver (Driver only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking rejected, next nearest driver assigned' })
  @ApiResponse({ status: 403, description: 'Not the assigned driver' })
  @Roles('driver')
  @UseGuards(RolesGuard)
  async rejectBooking(@Param('id') id: string, @Request() req) {
    await this.bookingService.rejectBooking(id, req.user.userId);
    return this.match(id);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start the trip (Driver only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Trip started, status set to "ongoing"' })
  @ApiResponse({ status: 403, description: 'Not the assigned driver' })
  @ApiResponse({ status: 400, description: 'Booking not in "accepted" state' })
  @Roles('driver')
  @UseGuards(RolesGuard)
  async startTrip(@Param('id') id: string, @Request() req) {
    return this.bookingService.startTrip(id, req.user.userId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete the trip (Driver only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Trip completed, driver set back to "available"' })
  @ApiResponse({ status: 403, description: 'Not the assigned driver' })
  @ApiResponse({ status: 400, description: 'Booking not in "ongoing" state' })
  @Roles('driver')
  @UseGuards(RolesGuard)
  async completeTrip(@Param('id') id: string, @Request() req) {
    const booking = await this.bookingService.completeTrip(id, req.user.userId);
    await this.driverService.updateStatus(req.user.userId, 'available');
    return booking;
  }
}
