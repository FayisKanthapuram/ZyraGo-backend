import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DriverDocument = Driver & Document;

@Schema({ timestamps: true })
export class Driver {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true })
  licenseNumber: string;

  @Prop({ default: 'available' })
  status: string; // available, busy, offline

  @Prop({ type: { lat: Number, lng: Number }, default: { lat: 0, lng: 0 } })
  location: { lat: number; lng: number };

  @Prop({ default: 5, min: 1, max: 50 })
  serviceRadius: number; // in km
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
