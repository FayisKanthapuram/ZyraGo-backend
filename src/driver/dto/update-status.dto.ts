import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['available', 'offline'], { message: 'Status must be either "available" or "offline"' })
  status: string;
}
