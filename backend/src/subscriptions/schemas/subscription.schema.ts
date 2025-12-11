import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionTier {
  BASIC = 'basic',
  FORENSIC = 'forensic',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  LLAMAPAY = 'llamapay',
  NONE = 'none',
}

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({
    enum: SubscriptionTier,
    required: true,
    default: SubscriptionTier.BASIC,
  })
  tier: SubscriptionTier;

  @Prop({
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  // Payment provider info
  @Prop({
    enum: PaymentProvider,
    default: PaymentProvider.NONE,
  })
  paymentProvider: PaymentProvider;

  // Stripe-specific fields
  @Prop()
  stripeSubscriptionId?: string;

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  stripePriceId?: string;

  // LlamaPay-specific fields
  @Prop()
  llamapayStreamId?: string;

  @Prop()
  llamapaySenderAddress?: string;

  @Prop()
  llamapayTokenAddress?: string;

  @Prop()
  llamapayBalance?: number; // Current balance in USD (after yield reduction)

  @Prop()
  llamapayLastBalanceCheck?: Date; // Last time we checked balance via API

  @Prop()
  llamapayDepositAmount?: number; // Original deposit amount in USD

  // Subscription dates
  @Prop({ required: true, default: Date.now })
  startDate: Date;

  @Prop()
  endDate?: Date; // null for active subscriptions

  @Prop()
  cancelledAt?: Date;

  @Prop()
  nextBillingDate?: Date;

  // Trial period (if applicable)
  @Prop({ default: false })
  isTrial: boolean;

  @Prop()
  trialEndDate?: Date;

  // Metadata
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Indexes for efficient queries
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 }, { sparse: true });
SubscriptionSchema.index({ llamapayStreamId: 1 }, { sparse: true });


