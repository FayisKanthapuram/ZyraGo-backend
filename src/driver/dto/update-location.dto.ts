import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ example: 12.9716, description: 'Current latitude' })
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @ApiProperty({ example: 77.5946, description: 'Current longitude' })
  @IsNumber()
  @IsNotEmpty()
  lng: number;
}
