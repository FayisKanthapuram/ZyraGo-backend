import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('driver')
@UseGuards(JwtAuthGuard)
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Patch('location')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async updateLocation(@Body() updateLocationDto: UpdateLocationDto, @Request() req) {
    return this.driverService.updateLocation(req.user.userId, updateLocationDto.lat, updateLocationDto.lng);
  }

  @Patch('status')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async updateStatus(@Body() updateStatusDto: UpdateStatusDto, @Request() req) {
    return this.driverService.updateStatus(req.user.userId, updateStatusDto.status);
  }
}
