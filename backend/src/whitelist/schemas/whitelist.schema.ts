import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WhitelistDocument = Whitelist & Document;

@Schema({ timestamps: true })
export class Whitelist {
    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const WhitelistSchema = SchemaFactory.createForClass(Whitelist);

// Create index on email for faster lookups
WhitelistSchema.index({ email: 1 }, { unique: true });

