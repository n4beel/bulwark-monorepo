import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ScanUsageDocument = ScanUsage & Document;

@Schema({ timestamps: true })
export class ScanUsage {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  month: number; // 1-12

  @Prop({ default: 0 })
  scanCount: number;

  @Prop({ default: 5 }) // Default limit for basic tier
  scanLimit: number;

  @Prop()
  resetDate: Date; // When this month's scans reset

  // Index for efficient queries
  @Prop()
  yearMonth: string; // Format: "2025-01" for indexing

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ScanUsageSchema = SchemaFactory.createForClass(ScanUsage);

// Compound index for efficient queries
ScanUsageSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });
ScanUsageSchema.index({ userId: 1, yearMonth: 1 }, { unique: true });


