import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ example: 'available', description: 'Driver availability status', enum: ['available', 'offline'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['available', 'offline'], { message: 'Status must be either "available" or "offline"' })
  status: string;
}
