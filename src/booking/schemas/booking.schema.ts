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
  startTime: Date;

  @Prop({ required: true })
  duration: number; // in minutes

  @Prop()
  otp: string; // 4-digit verification code

  @Prop({ default: 'requested' })
  status: string; // requested, assigned, accepted, arrived, ongoing, completed, cancelled

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Driver' }], default: [] })
  rejectedDrivers: Driver[];

  @Prop()
  estimatedPrice: number;

  // Payment & Fare
  @Prop({ default: 0 })
  fare: number;

  @Prop({ default: 'pending' })
  paymentStatus: string; // pending, paid

  // Rating
  @Prop({ min: 1, max: 5 })
  rating: number;

  @Prop()
  ratingComment: string;

  // Trip summary
  @Prop()
  completedAt: Date;

  @Prop({ default: 0 })
  distanceKm: number;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
