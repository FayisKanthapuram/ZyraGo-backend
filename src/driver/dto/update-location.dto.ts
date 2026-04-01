import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ example: 12.9716, description: 'Current latitude' })
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @ApiProperty({ example: 77.5946, description: 'Current longitude' })
  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @ApiProperty({ example: 5, description: 'Service radius in km (1-50)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  serviceRadius?: number;
}
