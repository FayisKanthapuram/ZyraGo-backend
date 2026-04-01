import { Controller, Post, Body, UseGuards, Request, Patch, Param, NotFoundException, Get } from '@nestjs/common';
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

  @Get('upcoming-passenger')
  @ApiOperation({ summary: 'Get upcoming bookings for passenger' })
  @Roles('user')
  @UseGuards(RolesGuard)
  async getUpcomingPassengerBooking(@Request() req) {
    return this.bookingService.getUpcomingBookingsForUser(req.user.userId);
  }

  @Get('upcoming-driver')
  @ApiOperation({ summary: 'Get upcoming bookings for driver' })
  @Roles('driver')
  @UseGuards(RolesGuard)
  async getUpcomingDriverBooking(@Request() req) {
    return this.bookingService.getUpcomingBookingsForDriver(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new booking (User only)' })
  @ApiResponse({ status: 201, description: 'Booking created with status "requested"' })
  @ApiResponse({ status: 403, description: 'Forbidden — only users can create bookings' })
  @Roles('user')
  @UseGuards(RolesGuard)
  async create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    const booking = await this.bookingService.create({
      ...createBookingDto,
      startTime: createBookingDto.startTime as any,
      user: req.user.userId,
      status: 'requested',
    });

    // Automatically attempt driver matching
    const matched = await this.bookingService.matchDriver(booking._id.toString());
    return matched || booking;
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

  @Patch(':id/arrive')
  @ApiOperation({ summary: 'Mark driver as arrived (Driver only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Driver arrived, status set to "arrived"' })
  @Roles('driver')
  @UseGuards(RolesGuard)
  async arriveAtLocation(@Param('id') id: string, @Request() req) {
    return this.bookingService.arriveAtLocation(id, req.user.userId);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start the trip with OTP verification (Driver only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Trip started, status set to "ongoing"' })
  @ApiResponse({ status: 403, description: 'Not the assigned driver' })
  @ApiResponse({ status: 400, description: 'Booking not in "arrived" state or Invalid OTP' })
  @Roles('driver')
  @UseGuards(RolesGuard)
  async startTrip(@Param('id') id: string, @Body() body: { otp: string }, @Request() req) {
    return this.bookingService.startTrip(id, req.user.userId, body.otp);
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
    return booking;
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a scheduled booking (User only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @Roles('user')
  @UseGuards(RolesGuard)
  async cancelBooking(@Param('id') id: string, @Request() req) {
    return this.bookingService.cancelBooking(id, req.user.userId);
  }

  @Patch(':id/driver-location')
  @ApiOperation({ summary: 'Send real-time location for an ongoing trip (Driver only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @Roles('driver')
  @UseGuards(RolesGuard)
  async updateDriverLocation(@Param('id') id: string, @Body() location: { lat: number; lng: number }, @Request() req) {
    return this.bookingService.updateDriverLocation(id, req.user.userId, location.lat, location.lng);
  }

  @Get('recent-completed')
  @ApiOperation({ summary: 'Get recently completed booking needing payment/rating (User only)' })
  @Roles('user')
  @UseGuards(RolesGuard)
  async getRecentCompleted(@Request() req) {
    return this.bookingService.findRecentCompletedForUser(req.user.userId);
  }

  @Patch(':id/rate')
  @ApiOperation({ summary: 'Rate a completed booking (User only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @Roles('user')
  @UseGuards(RolesGuard)
  async rateBooking(@Param('id') id: string, @Body() body: { rating: number; comment?: string }, @Request() req) {
    return this.bookingService.rateBooking(id, req.user.userId, body.rating, body.comment);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Simulate payment for a completed booking (User only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @Roles('user')
  @UseGuards(RolesGuard)
  async payBooking(@Param('id') id: string, @Request() req) {
    return this.bookingService.processPayment(id, req.user.userId);
  }

  @Get('history/user')
  @ApiOperation({ summary: 'Get ride history for rider' })
  @Roles('user')
  @UseGuards(RolesGuard)
  async getUserHistory(@Request() req) {
    return this.bookingService.getUserHistory(req.user.userId);
  }

  @Get('history/driver')
  @ApiOperation({ summary: 'Get ride history and earnings for driver' })
  @Roles('driver')
  @UseGuards(RolesGuard)
  async getDriverHistory(@Request() req) {
    return this.bookingService.getDriverHistory(req.user.userId);
  }
}
