import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import { Driver } from '../../driver/schemas/driver.schema';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Driver' })
  driver: Driver;

  @Prop({ type: { lat: Number, lng: Number }, required: true })
  pickupLocation: { lat: number; lng: number };

  @Prop({ required: true })
  duration: number; // in minutes or hours

  @Prop({ default: 'requested' })
  status: string; // requested, assigned, accepted, trip_started, trip_completed, cancelled

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Driver' }], default: [] })
  rejectedDrivers: Driver[];

  @Prop()
  estimatedPrice: number;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
