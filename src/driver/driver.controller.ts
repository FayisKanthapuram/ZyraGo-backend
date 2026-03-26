import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('driver')
@UseGuards(JwtAuthGuard)
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Patch('location')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async updateLocation(@Body() locationData: { lat: number; lng: number }, @Request() req) {
    return this.driverService.updateLocation(req.user.userId, locationData.lat, locationData.lng);
  }
}
