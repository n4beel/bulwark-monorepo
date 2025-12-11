import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionTier,
  SubscriptionStatus,
} from './schemas/subscription.schema';
import {
  ScanUsage,
  ScanUsageDocument,
} from './schemas/scan-usage.schema';
import { UserDocument, User } from '../users/schemas/user.schema';

export interface ScanCheckResult {
  canScan: boolean;
  reason?: string;
  scansRemaining?: number;
  scanLimit?: number;
  tier: string;
}

export interface ScanStatus {
  tier: string;
  scansUsed: number;
  scansRemaining: number;
  scanLimit: number;
  resetDate: Date;
  subscriptionStatus: string;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly BASIC_TIER_SCAN_LIMIT = 5;

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(ScanUsage.name)
    private scanUsageModel: Model<ScanUsageDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  /**
   * Check if user can perform a scan
   */
  async canUserScan(userId: string): Promise<ScanCheckResult> {
    try {
      // 1. Get user's subscription
      const subscription = await this.getUserSubscription(userId);

      // 2. If forensic tier and active, always allow
      if (
        subscription?.tier === SubscriptionTier.FORENSIC &&
        subscription?.status === SubscriptionStatus.ACTIVE
      ) {
        return {
          canScan: true,
          tier: SubscriptionTier.FORENSIC,
          scansRemaining: -1, // unlimited
        };
      }

      // 3. Get current month's scan usage
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      let scanUsage = await this.scanUsageModel.findOne({
        userId: new Types.ObjectId(userId),
        year,
        month,
      });

      // 4. Create scan usage record if doesn't exist
      if (!scanUsage) {
        const created = await this.createScanUsage(userId, year, month);
        if (!created) {
          throw new Error('Failed to create scan usage record');
        }
        scanUsage = created as any; // Type assertion to handle Mongoose document type
      }

      // Ensure scanUsage is not null (TypeScript guard)
      if (!scanUsage) {
        throw new Error('Scan usage record is null');
      }

      // 5. Check if limit exceeded
      const scansRemaining = scanUsage.scanLimit - scanUsage.scanCount;

      if (scansRemaining <= 0) {
        return {
          canScan: false,
          reason: 'Monthly scan limit exceeded',
          tier: SubscriptionTier.BASIC,
          scansRemaining: 0,
          scanLimit: scanUsage.scanLimit,
        };
      }

      return {
        canScan: true,
        tier: SubscriptionTier.BASIC,
        scansRemaining,
        scanLimit: scanUsage.scanLimit,
      };
    } catch (error) {
      this.logger.error(`Failed to check scan permission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's scan status
   */
  async getUserScanStatus(userId: string): Promise<ScanStatus> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      let scanUsage = await this.scanUsageModel.findOne({
        userId: new Types.ObjectId(userId),
        year,
        month,
      });

      if (!scanUsage) {
        const created = await this.createScanUsage(userId, year, month);
        if (!created) {
          throw new Error('Failed to create scan usage record');
        }
        scanUsage = created as any; // Type assertion to handle Mongoose document type
      }

      // Ensure scanUsage is not null (TypeScript guard)
      if (!scanUsage) {
        throw new Error('Scan usage record is null');
      }

      const tier = subscription?.tier || SubscriptionTier.BASIC;
      const scanLimit =
        tier === SubscriptionTier.FORENSIC ? -1 : scanUsage.scanLimit;
      const scansRemaining =
        tier === SubscriptionTier.FORENSIC
          ? -1
          : scanLimit - scanUsage.scanCount;

      // Calculate next reset date (first day of next month)
      const nextMonth = new Date(year, month, 1);
      const resetDate = scanUsage.resetDate || nextMonth;

      return {
        tier,
        scansUsed: scanUsage.scanCount,
        scansRemaining: scansRemaining < 0 ? -1 : scansRemaining,
        scanLimit: scanLimit < 0 ? -1 : scanLimit,
        resetDate,
        subscriptionStatus: subscription?.status || SubscriptionStatus.ACTIVE,
      };
    } catch (error) {
      this.logger.error(`Failed to get scan status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Increment scan count (only for basic tier)
   */
  async incrementScanCount(userId: string): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);

      // Don't increment for forensic tier
      if (subscription?.tier === SubscriptionTier.FORENSIC) {
        return;
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const scanUsage = await this.scanUsageModel.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          year,
          month,
        },
        {
          $inc: { scanCount: 1 },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );

      // Update yearMonth if needed
      if (!scanUsage.yearMonth) {
        scanUsage.yearMonth = `${year}-${String(month).padStart(2, '0')}`;
        await scanUsage.save();
      }

      // Update user's denormalized fields
      await this.updateUserScanFields(userId, scanUsage.scanCount);

      this.logger.log(
        `Incremented scan count for user ${userId}: ${scanUsage.scanCount}/${scanUsage.scanLimit}`,
      );
    } catch (error) {
      this.logger.error(`Failed to increment scan count: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create scan usage record
   */
  private async createScanUsage(
    userId: string,
    year: number,
    month: number,
  ): Promise<ScanUsageDocument | null> {
    try {
      // Calculate next reset date (first day of next month)
      const nextMonth = new Date(year, month, 1);
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

      const scanUsage = new this.scanUsageModel({
        userId: new Types.ObjectId(userId),
        year,
        month,
        scanCount: 0,
        scanLimit: this.BASIC_TIER_SCAN_LIMIT,
        resetDate: nextMonth,
        yearMonth,
      });

      const saved = await scanUsage.save();
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create scan usage: ${error.message}`);
      return null;
    }
  }

  /**
   * Get or create subscription for user
   */
  async getOrCreateSubscription(
    userId: string,
  ): Promise<SubscriptionDocument | null> {
    try {
      let subscription = await this.subscriptionModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();

      if (!subscription) {
        // Create basic tier subscription by default
        subscription = new this.subscriptionModel({
          userId: new Types.ObjectId(userId),
          tier: SubscriptionTier.BASIC,
          status: SubscriptionStatus.ACTIVE,
          paymentProvider: 'none',
          startDate: new Date(),
        });
        await subscription.save();
        this.logger.log(`Created default basic subscription for user ${userId}`);
      }

      return subscription;
    } catch (error) {
      this.logger.error(
        `Failed to get or create subscription: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get user's subscription
   */
  async getUserSubscription(
    userId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  /**
   * Find user by email (for webhook fallback)
   */
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    try {
      // Try to find by email field first
      let user = await this.userModel.findOne({ email }).exec();
      
      // If not found, try emails array
      if (!user) {
        user = await this.userModel.findOne({ emails: email }).exec();
      }
      
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by email: ${error.message}`);
      return null;
    }
  }

  /**
   * Update subscription tier
   */
  async updateSubscriptionTier(
    userId: string,
    tier: SubscriptionTier,
    paymentProvider: string,
    paymentData: any,
  ): Promise<SubscriptionDocument> {
    try {
      let subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        subscription = await this.getOrCreateSubscription(userId);
      }

      // Ensure subscription is not null
      if (!subscription) {
        throw new Error('Failed to get or create subscription');
      }

      // Update subscription
      subscription.tier = tier;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.paymentProvider = paymentProvider as any;

      // Update payment-specific fields
      if (paymentProvider === 'stripe') {
        subscription.stripeSubscriptionId = paymentData.subscriptionId;
        subscription.stripeCustomerId = paymentData.customerId;
        subscription.stripePriceId = paymentData.priceId;
        subscription.nextBillingDate = paymentData.nextBillingDate;
      } else if (paymentProvider === 'llamapay') {
        subscription.llamapayStreamId = paymentData.streamId || paymentData.chargeId;
        subscription.llamapayTokenAddress = paymentData.tokenAddress;
        
        // Store deposit amount (original amount user deposited)
        subscription.llamapayDepositAmount = paymentData.amountPerPeriod 
          ? paymentData.amountPerPeriod / 100 // Convert cents to dollars
          : undefined;
        
        // Initial balance is the deposit amount (will be updated by webhooks)
        // Note: Actual balance will be less due to yield reduction, but we'll update via webhooks
        subscription.llamapayBalance = subscription.llamapayDepositAmount;
        subscription.llamapayLastBalanceCheck = new Date();
        
        // Calculate next billing date (1 month from now)
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        subscription.nextBillingDate = nextBillingDate;
      }

      subscription.startDate = new Date();
      subscription.endDate = undefined;
      subscription.cancelledAt = undefined;

      await subscription.save();

      // Update user's denormalized fields
      await this.updateUserSubscriptionFields(userId, subscription);

      this.logger.log(`Updated subscription tier to ${tier} for user ${userId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to update subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<SubscriptionDocument> {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = new Date();
      subscription.tier = SubscriptionTier.BASIC; // Downgrade to basic
      subscription.endDate = new Date();

      await subscription.save();

      // Update user's denormalized fields
      await this.updateUserSubscriptionFields(userId, subscription);

      this.logger.log(`Cancelled subscription for user ${userId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reset monthly scans (cron job)
   */
  async resetMonthlyScans(): Promise<void> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Find all scan usage records that need reset
      const recordsToReset = await this.scanUsageModel.find({
        resetDate: { $lte: today },
      });

      this.logger.log(
        `Resetting ${recordsToReset.length} scan usage records`,
      );

      for (const record of recordsToReset) {
        // Reset scan count
        record.scanCount = 0;

        // Calculate next reset date (first day of next month)
        let nextYear = record.year;
        let nextMonth = record.month + 1;

        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear += 1;
        }

        record.year = nextYear;
        record.month = nextMonth;
        record.resetDate = new Date(nextYear, nextMonth - 1, 1);
        record.yearMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;

        await record.save();

        // Update user's denormalized fields
        await this.updateUserScanFields(
          record.userId.toString(),
          record.scanCount,
        );
      }

      this.logger.log('Monthly scan reset completed');
    } catch (error) {
      this.logger.error(`Failed to reset monthly scans: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user's denormalized scan fields
   */
  private async updateUserScanFields(
    userId: string,
    scanCount: number,
  ): Promise<void> {
    try {
      const scanUsage = await this.scanUsageModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .exec();

      if (scanUsage) {
        const updateData: any = {
          scansUsedThisMonth: scanCount,
        };

        if (scanUsage.resetDate) {
          updateData.scanResetDate = scanUsage.resetDate;
        }

        await this.userModel.findByIdAndUpdate(userId, updateData).exec();
      }
    } catch (error) {
      this.logger.warn(
        `Failed to update user scan fields: ${error.message}`,
      );
    }
  }

  /**
   * Update user's denormalized subscription fields
   */
  private async updateUserSubscriptionFields(
    userId: string,
    subscription: SubscriptionDocument,
  ): Promise<void> {
    try {
      await this.userModel
        .findByIdAndUpdate(userId, {
          subscriptionId: String(subscription._id),
          tier: subscription.tier,
        })
        .exec();
    } catch (error) {
      this.logger.warn(
        `Failed to update user subscription fields: ${error.message}`,
      );
    }
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  async getSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({ stripeSubscriptionId })
      .exec();
  }

  /**
   * Get subscription by LlamaPay charge ID
   */
  async getSubscriptionByLlamaPayChargeId(
    chargeId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({ llamapayStreamId: chargeId })
      .exec();
  }

  /**
   * Update subscription from LlamaPay webhook data
   */
  async updateSubscriptionFromLlamaPay(
    userId: string,
    llamapayData: {
      chargeId: string;
      status: string;
      amount?: string | number;
      tokenAddress?: string;
      isRenewal?: boolean; // True if this is a renewal (balance used for next month)
      balance?: number; // Current LlamaPay balance in USD
    },
  ): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status =
      llamapayData.status === 'paid' || llamapayData.status === 'succeeded'
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.EXPIRED;

    subscription.llamapayStreamId = llamapayData.chargeId;
    if (llamapayData.tokenAddress) {
      subscription.llamapayTokenAddress = llamapayData.tokenAddress;
    }

    // Update balance if provided
    if (llamapayData.balance !== undefined) {
      subscription.llamapayBalance = llamapayData.balance;
      subscription.llamapayLastBalanceCheck = new Date();
    }

    // Calculate next billing date
    if (llamapayData.isRenewal) {
      // Renewal: extend billing period by 1 month from current nextBillingDate
      const currentNextBilling = subscription.nextBillingDate || new Date();
      const nextBillingDate = new Date(currentNextBilling);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      subscription.nextBillingDate = nextBillingDate;
    } else {
      // New payment: set next billing date to 1 month from now
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      subscription.nextBillingDate = nextBillingDate;
    }

    await subscription.save();
    await this.updateUserSubscriptionFields(userId, subscription);

    return subscription;
  }

  /**
   * Update subscription from Stripe webhook data
   */
  async updateSubscriptionFromStripe(
    userId: string,
    stripeSubscription: any,
  ): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Map Stripe subscription status to our subscription status
    if (stripeSubscription.status === 'active') {
      subscription.status = SubscriptionStatus.ACTIVE;
    } else if (
      stripeSubscription.status === 'canceled' ||
      stripeSubscription.status === 'cancelled' ||
      stripeSubscription.status === 'past_due' ||
      stripeSubscription.status === 'unpaid' ||
      stripeSubscription.status === 'incomplete_expired'
    ) {
      // If subscription is canceled, past_due, unpaid, or incomplete_expired, mark as cancelled
      subscription.status = SubscriptionStatus.CANCELLED;
      // Also downgrade tier to Basic
      subscription.tier = SubscriptionTier.BASIC;
      subscription.endDate = new Date();
      subscription.cancelledAt = new Date();
    } else {
      subscription.status = SubscriptionStatus.EXPIRED;
    }

    subscription.stripeSubscriptionId = stripeSubscription.id;
    
    // Extract customer ID (handle both string and expanded object)
    if (stripeSubscription.customer) {
      subscription.stripeCustomerId =
        typeof stripeSubscription.customer === 'string'
          ? stripeSubscription.customer
          : stripeSubscription.customer?.id || '';
    }

    // Extract current_period_end safely
    const currentPeriodEnd = stripeSubscription.current_period_end;
    if (currentPeriodEnd) {
      subscription.nextBillingDate = new Date(currentPeriodEnd * 1000);
    }

    if (stripeSubscription.cancel_at_period_end && currentPeriodEnd) {
      subscription.endDate = new Date(currentPeriodEnd * 1000);
    } else {
      subscription.endDate = undefined;
    }

    await subscription.save();
    await this.updateUserSubscriptionFields(userId, subscription);

    return subscription;
  }

  /**
   * Ensure subscription is active
   */
  async ensureSubscriptionActive(userId: string): Promise<void> {
    const subscription = await this.getUserSubscription(userId);
    if (subscription && subscription.status !== SubscriptionStatus.ACTIVE) {
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.endDate = undefined;
      subscription.cancelledAt = undefined;
      await subscription.save();
      await this.updateUserSubscriptionFields(userId, subscription);
    }
  }
}

