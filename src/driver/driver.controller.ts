import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('Driver')
@ApiBearerAuth('JWT-auth')
@Controller('driver')
@UseGuards(JwtAuthGuard)
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Patch('location')
  @ApiOperation({ summary: 'Update current location (Driver only)' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — only drivers can update location' })
  @Roles('driver')
  @UseGuards(RolesGuard)
  async updateLocation(@Body() updateLocationDto: UpdateLocationDto, @Request() req) {
    return this.driverService.updateLocation(
      req.user.userId, 
      updateLocationDto.lat, 
      updateLocationDto.lng,
      updateLocationDto.serviceRadius
    );
  }

  @Patch('status')
  @ApiOperation({ summary: 'Toggle online/offline status (Driver only)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status value' })
  @ApiResponse({ status: 403, description: 'Forbidden — only drivers can update status' })
  @Roles('driver')
  @UseGuards(RolesGuard)
  async updateStatus(@Body() updateStatusDto: UpdateStatusDto, @Request() req) {
    return this.driverService.updateStatus(req.user.userId, updateStatusDto.status);
  }
}
