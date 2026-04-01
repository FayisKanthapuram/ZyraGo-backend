import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @ApiProperty({ example: 12.9716, description: 'Latitude of pickup location' })
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @ApiProperty({ example: 77.5946, description: 'Longitude of pickup location' })
  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

export class CreateBookingDto {
  @ApiProperty({ type: LocationDto, description: 'Pickup coordinates (lat/lng)' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation: LocationDto;

  @ApiProperty({ example: 30, description: 'Estimated trip duration in minutes' })
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @ApiProperty({ example: '2026-04-02T10:00:00Z', description: 'Scheduled start time for the trip' })
  @IsNotEmpty()
  startTime: string; // Controller/Service will convert or validate as ISO Date
}
