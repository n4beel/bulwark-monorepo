import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import axios from 'axios';
import { SubscriptionService } from './subscription.service';
import { SubscriptionTier } from './schemas/subscription.schema';

export interface StripeSubscriptionData {
  subscriptionId: string;
  customerId: string;
  priceId: string;
  nextBillingDate?: Date;
}

export interface LlamaPayStreamData {
  streamId: string;
  chargeId: string;
  hostedUrl: string;
  senderAddress?: string;
  tokenAddress?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripe: Stripe;
  private readonly stripeWebhookSecret: string;
  private readonly llamapayApiKey: string;
  private readonly llamapayWebhookSecret: string;
  private readonly llamapayApiUrl: string;
  private readonly isTestnet: boolean;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => SubscriptionService))
    private subscriptionService: SubscriptionService,
  ) {
    const stripeSecretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
      this.configService.get<string>('STEIPE_SECRET_KEY') || // Support typo in env
      '';

    if (!stripeSecretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY not found. Stripe functionality will be disabled.',
      );
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-11-17.clover',
      });
      this.logger.log('Stripe initialized successfully');
    }

    this.stripeWebhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';

    // Initialize LlamaPay
    const llamapayApiKeyRaw = this.configService.get<string>('LLAMAPAY_API_KEY') || '';
    this.llamapayApiKey = llamapayApiKeyRaw.trim(); // Trim whitespace
    this.llamapayWebhookSecret = (this.configService.get<string>('LLAMAPAY_WEBHOOK_SECRET') || '').trim();

    // Check if testnet mode is enabled
    this.isTestnet = this.configService.get<string>('LLAMAPAY_TESTNET') === 'true' ||
      this.configService.get<string>('NODE_ENV') === 'development';

    // LlamaPay API URL (same for testnet/mainnet, but you can use test API keys)
    this.llamapayApiUrl = 'https://api.llamapay.io';

    if (this.llamapayApiKey) {
      const mode = this.isTestnet ? 'TESTNET' : 'MAINNET';
      this.logger.log(`LlamaPay initialized successfully (${mode} mode, API key: ${this.llamapayApiKey.substring(0, 15)}...)`);
    } else {
      this.logger.warn('LLAMAPAY_API_KEY not found. LlamaPay features disabled.');
    }
  }

  /**
   * Create Stripe subscription
   */
  async createStripeSubscription(
    userId: string,
    customerId: string,
    priceId: string,
  ): Promise<StripeSubscriptionData> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY.');
      }

      this.logger.log(
        `Creating Stripe subscription for user ${userId}, customer ${customerId}, price ${priceId}`,
      );

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          userId,
        },
        expand: ['latest_invoice.payment_intent'],
      });

      this.logger.log(
        `Stripe subscription created: ${subscription.id} for user ${userId}`,
      );

      // Extract customer ID from subscription (handle both string and expanded object)
      const subscriptionCustomerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id || customerId; // Fallback to parameter if not found

      // Extract current_period_end safely
      const currentPeriodEnd = (subscription as any).current_period_end;
      const nextBillingDate = currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000)
        : undefined;

      return {
        subscriptionId: subscription.id,
        customerId: subscriptionCustomerId,
        priceId: priceId,
        nextBillingDate: nextBillingDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create Stripe subscription: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Create Stripe customer
   */
  async createStripeCustomer(
    email: string,
    name?: string,
    userId?: string,
  ): Promise<string> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY.');
      }

      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId || '',
        },
      });

      this.logger.log(`Stripe customer created: ${customer.id}`);
      return customer.id;
    } catch (error) {
      this.logger.error(`Failed to create Stripe customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<string> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY.');
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
        },
        subscription_data: {
          metadata: {
            userId,
          },
        },
      });

      this.logger.log(`Stripe checkout session created: ${session.id}`);
      return session.url || '';
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Create LlamaPay payment link for subscription
   * LlamaPay uses a charge-based system where users pay monthly
   */
  async createLlamaPayStream(
    userId: string,
    amountPerPeriod: number, // Amount in USD cents (e.g., 5000 = $50.00)
    tokenAddress?: string, // Optional: specific token address (not used in API, but stored for reference)
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<LlamaPayStreamData> {
    try {
      if (!this.llamapayApiKey) {
        throw new Error('LlamaPay API key not configured');
      }

      // Convert cents to dollars (e.g., 5000 cents = $50.00)
      const amountInDollars = (amountPerPeriod / 100).toFixed(2);

      this.logger.log(
        `Creating LlamaPay payment link for user ${userId}, amount: $${amountInDollars}`,
      );

      // Prepare request body according to LlamaPay API format
      const requestBody: any = {
        pricing_type: 'subscription', // For recurring monthly payments
        local_price: {
          amount: amountInDollars, // Amount as string in USD
          currency: 'USD',
        },
        metadata: {
          userId: userId,
          tier: 'forensic',
          amountPerPeriod: amountPerPeriod.toString(),
          period: 'monthly',
          testnet: this.isTestnet ? 'true' : 'false', // Mark testnet payments
        },
        redirect_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3001'}/admin/subscriptions?success=true&provider=llamapay`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3001'}/admin/subscriptions?canceled=true&provider=llamapay`,
      };

      // If testnet mode is enabled, try to specify testnet networks
      // Note: LlamaPay may not support Sepolia directly - check their dashboard for testnet settings
      if (this.isTestnet) {
        // Some payment gateways support testnet via environment or API parameter
        // LlamaPay might need to be configured in their dashboard for testnet mode
        this.logger.warn('Testnet mode enabled - LlamaPay may need testnet configuration in dashboard');
      }

      // Log request details for debugging (without exposing full API key)
      this.logger.debug(`LlamaPay API Request to ${this.llamapayApiUrl}/charges`);
      this.logger.debug(`Authorization header: ${this.llamapayApiKey.substring(0, 20)}...`);
      this.logger.debug(`Request body: ${JSON.stringify(requestBody, null, 2)}`);

      const response = await axios.post(
        `${this.llamapayApiUrl}/charges`,
        requestBody,
        {
          headers: {
            'Authorization': this.llamapayApiKey, // LlamaPay expects the API key directly, not Bearer format
            'Content-Type': 'application/json',
          },
        },
      );

      // LlamaPay response is wrapped in a 'data' object
      const chargeData = response.data?.data || response.data;

      if (!chargeData || !chargeData.hosted_url) {
        this.logger.error(`Invalid LlamaPay response: ${JSON.stringify(response.data)}`);
        throw new Error('Invalid response from LlamaPay API');
      }

      // Extract charge ID from hosted_url or use id if available
      const chargeId = chargeData.id || chargeData.hosted_url.split('/').pop() || 'unknown';

      this.logger.log(
        `LlamaPay payment link created: ${chargeId}, URL: ${chargeData.hosted_url}`,
      );

      return {
        streamId: chargeId, // LlamaPay charge ID
        chargeId: chargeId,
        hostedUrl: chargeData.hosted_url,
        tokenAddress: tokenAddress, // Store for reference, though not used in API
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to create LlamaPay payment link: ${error.message}`,
      );
      if (error.response) {
        this.logger.error(`LlamaPay API error: ${JSON.stringify(error.response.data)}`);
        this.logger.error(`Status: ${error.response.status}, Headers: ${JSON.stringify(error.response.headers)}`);
      }
      throw error;
    }
  }

  /**
   * Verify and construct Stripe webhook event
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    if (!this.stripe) {
      throw new Error('Stripe is not initialized. Check STRIPE_SECRET_KEY.');
    }

    if (!this.stripeWebhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET not configured. Webhook verification disabled.',
      );
    }

    // Diagnostic logging
    const payloadLength = Buffer.isBuffer(payload) ? payload.length : payload.length;
    const secretPrefix = this.stripeWebhookSecret.substring(0, 10);
    const signaturePrefix = signature?.substring(0, 50) || 'MISSING';

    this.logger.debug(`Verifying webhook: payload=${payloadLength} bytes, secret=${secretPrefix}..., signature=${signaturePrefix}...`);

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.stripeWebhookSecret,
      );
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      this.logger.error(`Diagnostics:`);
      this.logger.error(`  - Payload length: ${payloadLength} bytes`);
      this.logger.error(`  - Payload type: ${Buffer.isBuffer(payload) ? 'Buffer' : typeof payload}`);
      this.logger.error(`  - Signature format: ${signature?.includes('t=') ? 'Valid' : 'Invalid (missing timestamp)'}`);
      this.logger.error(`  - Webhook secret configured: ${!!this.stripeWebhookSecret}`);
      this.logger.error(`  - Webhook secret prefix: ${secretPrefix}...`);
      this.logger.error(`  - Signature prefix: ${signaturePrefix}...`);

      // Common issues
      if (!signature?.includes('t=')) {
        this.logger.error(`⚠️  Signature header format is invalid. Expected format: "t=timestamp,v1=signature"`);
      }

      if (!this.stripeWebhookSecret.startsWith('whsec_')) {
        this.logger.error(`⚠️  Webhook secret should start with "whsec_"`);
      }

      this.logger.error(`💡 Common fixes:`);
      this.logger.error(`  1. Verify STRIPE_WEBHOOK_SECRET matches the endpoint secret in Stripe Dashboard`);
      this.logger.error(`  2. Ensure you're using the Dashboard secret, not Stripe CLI secret (they're different)`);
      this.logger.error(`  3. Check if using test vs production secrets correctly`);
      this.logger.error(`  4. Verify the webhook endpoint URL matches exactly in Stripe Dashboard`);

      throw error;
    }
  }

  /**
   * Handle Stripe webhook event
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      this.logger.log(`Handling Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleStripeSubscriptionUpdate(
            event.data.object as Stripe.Subscription,
          );
          break;
        case 'customer.subscription.deleted':
          await this.handleStripeSubscriptionCancellation(
            event.data.object as Stripe.Subscription,
          );
          break;
        case 'invoice.payment_succeeded':
          await this.handleStripePaymentSuccess(
            event.data.object as Stripe.Invoice,
          );
          break;
        case 'invoice.payment_failed':
          await this.handleStripePaymentFailure(
            event.data.object as Stripe.Invoice,
          );
          break;
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;
        default:
          this.logger.warn(`Unhandled Stripe webhook event: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle Stripe webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify LlamaPay webhook signature
   * According to LlamaPay docs: Use HMAC-SHA256 with webhook secret, compare with X-CC-WEBHOOK-SIGNATURE header
   */
  verifyLlamaPayWebhook(
    payload: string | Buffer,
    signature: string,
  ): boolean {
    try {
      if (!this.llamapayWebhookSecret) {
        this.logger.warn('LlamaPay webhook secret not configured');
        return false;
      }

      // LlamaPay uses HMAC-SHA256 for webhook verification
      // Signature is sent in X-CC-WEBHOOK-SIGNATURE header
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', this.llamapayWebhookSecret);

      // Use raw body (Buffer or string) for signature calculation
      const payloadBuffer = typeof payload === 'string'
        ? Buffer.from(payload, 'utf8')
        : Buffer.isBuffer(payload)
          ? payload
          : Buffer.from(JSON.stringify(payload), 'utf8');

      hmac.update(payloadBuffer);
      const calculatedSignature = hmac.digest('hex');

      // Compare signatures using timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(calculatedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error(`Failed to verify LlamaPay webhook: ${error.message}`);
      return false;
    }
  }

  /**
   * Handle LlamaPay webhook event
   * LlamaPay webhook structure: { event: { type, data: { id, metadata, ... }, ... } }
   * Note: LlamaPay retries webhooks for 3 days if not HTTP 200, so we process asynchronously
   */
  async handleLlamaPayEvent(eventPayload: any): Promise<void> {
    try {
      // Extract event data from LlamaPay's webhook structure
      const event = eventPayload?.event || eventPayload;
      const eventType = event?.type;
      const eventId = event?.id;
      const eventData = event?.data || eventPayload?.data;

      // Extract charge/payment ID and metadata
      const chargeId = eventData?.id || eventPayload?.id;
      const metadata = eventData?.metadata || eventPayload?.metadata;
      const userId = metadata?.userId;

      this.logger.log(`Handling LlamaPay event: ${eventType} (event ID: ${eventId}, charge ID: ${chargeId})`);

      // Idempotency check: LlamaPay docs say event ID is the same on all retries
      // We can use this to prevent processing the same event twice
      if (eventId) {
        this.logger.debug(`Processing event with ID: ${eventId}`);
      }

      if (!userId) {
        this.logger.warn(
          `No userId in LlamaPay event metadata for charge ${chargeId}`,
        );
        this.logger.debug(`Event metadata: ${JSON.stringify(metadata)}`);
        this.logger.debug(`Full event payload: ${JSON.stringify(eventPayload)}`);
        return;
      }

      // Handle different event types according to LlamaPay docs
      switch (eventType) {
        case 'charge:pending':
          // Payment transaction has been included on chain
          // LlamaPay recommends applying effects immediately for better UX
          await this.handleLlamaPayPaymentSuccess(eventData || eventPayload, userId, chargeId);
          break;

        case 'charge:confirmed':
          // Payment transaction has been finalized on chain
          // This is a confirmation after charge:pending
          // Update subscription status if needed
          await this.handleLlamaPayPaymentConfirmed(eventData || eventPayload, userId, chargeId);
          break;

        case 'subscription:expired':
          // Subscription has expired due to insufficient funds
          await this.handleLlamaPaySubscriptionExpired(eventData || eventPayload, userId, chargeId);
          break;

        default:
          this.logger.log(`Unhandled LlamaPay event type: ${eventType}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle LlamaPay event: ${error.message}`);
      this.logger.error(`Event payload: ${JSON.stringify(eventPayload)}`);
    }
  }

  /**
   * Handle successful LlamaPay payment (charge:pending event)
   * This is called when payment transaction is included on chain
   */
  private async handleLlamaPayPaymentSuccess(
    eventData: any,
    userId: string,
    chargeId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `LlamaPay payment pending/confirmed for user ${userId}, charge ${chargeId}`,
      );

      // Extract pricing and metadata from event data
      const pricing = eventData?.pricing?.local || {};
      const metadata = eventData?.metadata || {};
      const amountPerPeriod = metadata?.amountPerPeriod
        ? parseInt(metadata.amountPerPeriod)
        : pricing?.amount
          ? Math.round(parseFloat(pricing.amount) * 100) // Convert dollars to cents
          : 100; // Default to $1 for testing

      // Calculate balance after yield reduction
      // LlamaPay deposits to AAVE, so actual balance is less than deposit
      // For now, we'll estimate balance based on deposit amount
      // In production, you might want to query LlamaPay API for exact balance
      const depositAmount = amountPerPeriod / 100; // Convert cents to dollars
      // Note: Actual balance will be updated when we receive balance info from webhooks
      // For initial payment, balance is approximately the deposit amount
      const estimatedBalance = depositAmount;

      // Check if subscription already exists
      const existingSubscription =
        await this.subscriptionService.getSubscriptionByLlamaPayChargeId(
          chargeId,
        );

      if (existingSubscription) {
        this.logger.log(
          `Subscription already exists for charge ${chargeId}, updating for renewal...`,
        );
        // This is a renewal - balance was used for next billing cycle
        // Update subscription status and extend billing period
        await this.subscriptionService.updateSubscriptionFromLlamaPay(
          userId,
          {
            chargeId,
            status: 'paid',
            amount: amountPerPeriod,
            isRenewal: true, // Mark as renewal
          },
        );
        this.logger.log(
          `Renewed Forensic subscription for user ${userId} via LlamaPay (charge: ${chargeId})`,
        );
      } else {
        // Create new subscription
        await this.subscriptionService.updateSubscriptionTier(
          userId,
          SubscriptionTier.FORENSIC,
          'llamapay',
          {
            chargeId: chargeId,
            streamId: chargeId, // For LlamaPay, charge ID serves as stream ID
            amountPerPeriod: amountPerPeriod,
            nextBillingDate: this.calculateNextBillingDate(),
          },
        );

        // Update balance after subscription creation
        const subscription = await this.subscriptionService.getSubscriptionByLlamaPayChargeId(chargeId);
        if (subscription) {
          await this.subscriptionService.updateSubscriptionFromLlamaPay(
            userId,
            {
              chargeId,
              status: 'paid',
              amount: amountPerPeriod,
              balance: estimatedBalance,
            },
          );
        }
        this.logger.log(
          `Created Forensic subscription for user ${userId} via LlamaPay (charge: ${chargeId})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle LlamaPay payment success: ${error.message}`,
      );
      this.logger.error(`Event data: ${JSON.stringify(eventData)}`);
    }
  }

  /**
   * Handle confirmed LlamaPay payment (charge:confirmed event)
   * This is called after charge:pending when transaction is finalized
   */
  private async handleLlamaPayPaymentConfirmed(
    eventData: any,
    userId: string,
    chargeId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `LlamaPay payment confirmed (finalized) for user ${userId}, charge ${chargeId}`,
      );

      // Update subscription to confirmed status if needed
      const subscription =
        await this.subscriptionService.getSubscriptionByLlamaPayChargeId(
          chargeId,
        );

      if (subscription) {
        // Subscription already created in charge:pending, just log confirmation
        this.logger.log(`Payment confirmed for subscription ${subscription._id}`);
      } else {
        // If subscription doesn't exist, create it (fallback)
        this.logger.warn(`Subscription not found for confirmed charge ${chargeId}, creating...`);
        await this.handleLlamaPayPaymentSuccess(eventData, userId, chargeId);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle LlamaPay payment confirmation: ${error.message}`,
      );
    }
  }

  /**
   * Handle expired LlamaPay subscription (subscription:expired event)
   * This happens when subscription reaches its end and there's not enough money
   */
  private async handleLlamaPaySubscriptionExpired(
    eventData: any,
    userId: string,
    chargeId: string,
  ): Promise<void> {
    try {
      this.logger.warn(
        `LlamaPay subscription expired for user ${userId}, charge ${chargeId}`,
      );

      // Cancel subscription and downgrade to Basic
      await this.subscriptionService.cancelSubscription(userId);
      this.logger.log(`Downgraded user ${userId} to Basic tier due to expired subscription`);
    } catch (error) {
      this.logger.error(
        `Failed to handle LlamaPay subscription expiration: ${error.message}`,
      );
    }
  }

  /**
   * Calculate next billing date (1 month from now)
   */
  private calculateNextBillingDate(): Date {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
  }

  /**
   * Verify payment status
   */
  async verifyPaymentStatus(subscriptionId: string): Promise<boolean> {
    try {
      // TODO: Implement actual payment verification
      // For Stripe: Check subscription status via API
      // For LlamaPay: Check stream status on-chain

      return true; // Placeholder
    } catch (error) {
      this.logger.error(
        `Failed to verify payment status: ${error.message}`,
      );
      return false;
    }
  }

  private async handleStripeSubscriptionUpdate(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    try {
      let userId = subscription.metadata?.userId;

      // If userId is missing from subscription metadata, try to get it from customer metadata
      if (!userId && this.stripe) {
        try {
          const customer = await this.stripe.customers.retrieve(
            subscription.customer as string,
          );
          if (typeof customer !== 'string' && !('deleted' in customer && customer.deleted)) {
            userId = customer.metadata?.userId;

            // If still not found, try to find user by customer email
            if (!userId && customer.email) {
              // Try to find user by email in our database
              const user = await this.subscriptionService.findUserByEmail(customer.email);
              if (user) {
                userId = String(user._id);
                // Update both customer and subscription metadata
                await Promise.all([
                  this.stripe.customers.update(customer.id, {
                    metadata: { userId: userId },
                  }),
                  this.stripe.subscriptions.update(subscription.id, {
                    metadata: { userId: userId },
                  }),
                ]);
                this.logger.log(
                  `Found userId ${userId} by email ${customer.email} and updated metadata`,
                );
              }
            }

            // If found in customer metadata, update subscription metadata
            if (userId && !subscription.metadata?.userId) {
              await this.stripe.subscriptions.update(subscription.id, {
                metadata: {
                  userId: userId,
                },
              });
              this.logger.log(
                `Updated subscription ${subscription.id} metadata with userId from customer`,
              );
            }
          }
        } catch (error) {
          this.logger.warn(
            `Failed to fetch customer for subscription ${subscription.id}: ${error.message}`,
          );
        }
      }

      if (!userId) {
        this.logger.warn(
          `No userId in subscription or customer metadata for ${subscription.id}. Cannot create subscription.`,
        );
        return;
      }

      // Find subscription by Stripe subscription ID
      const existingSubscription =
        await this.subscriptionService.getSubscriptionByStripeId(
          subscription.id,
        );

      if (existingSubscription) {
        // Check if subscription status indicates it should be downgraded
        const inactiveStatuses = [
          'past_due',
          'unpaid',
          'canceled',
          'incomplete_expired',
        ];

        if (inactiveStatuses.includes(subscription.status)) {
          // Subscription is no longer active, downgrade user
          this.logger.warn(
            `Subscription ${subscription.id} has status ${subscription.status}, downgrading user ${userId}`,
          );
          await this.subscriptionService.cancelSubscription(userId);
          this.logger.log(
            `Downgraded user ${userId} to Basic tier due to subscription status: ${subscription.status}`,
          );
        } else {
          // Update existing subscription (still active)
          await this.subscriptionService.updateSubscriptionFromStripe(
            existingSubscription.userId.toString(),
            subscription,
          );
          this.logger.log(
            `Updated subscription ${subscription.id} for user ${userId}`,
          );
        }
      } else {
        // Create new subscription if it doesn't exist
        // Extract customer ID (handle both string and expanded object)
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id || '';

        // Extract current_period_end safely
        const currentPeriodEnd = (subscription as any).current_period_end;
        const nextBillingDate = currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000)
          : undefined;

        await this.subscriptionService.updateSubscriptionTier(
          userId,
          SubscriptionTier.FORENSIC,
          'stripe',
          {
            subscriptionId: subscription.id,
            customerId: customerId,
            priceId: subscription.items.data[0]?.price.id || '',
            nextBillingDate: nextBillingDate,
          },
        );
        this.logger.log(
          `Created subscription ${subscription.id} for user ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle subscription update: ${error.message}`,
      );
    }
  }

  private async handleStripeSubscriptionCancellation(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) {
        this.logger.warn(
          `No userId in subscription metadata for ${subscription.id}`,
        );
        return;
      }

      await this.subscriptionService.cancelSubscription(userId);
      this.logger.log(
        `Cancelled subscription ${subscription.id} for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle subscription cancellation: ${error.message}`,
      );
    }
  }

  private async handleStripePaymentSuccess(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    try {
      // Invoice.subscription can be a string ID or expanded Subscription object
      const subscriptionId =
        typeof (invoice as any).subscription === 'string'
          ? (invoice as any).subscription
          : (invoice as any).subscription?.id;
      if (!subscriptionId) {
        return;
      }

      // Find subscription and ensure it's active
      let subscription =
        await this.subscriptionService.getSubscriptionByStripeId(
          subscriptionId,
        );

      // If subscription doesn't exist, fetch it from Stripe and create it
      if (!subscription && this.stripe) {
        try {
          const stripeSubscription = await this.stripe.subscriptions.retrieve(
            subscriptionId,
            {
              expand: ['customer'],
            },
          );

          let userId = stripeSubscription.metadata?.userId;

          // If userId is missing, try to get it from customer metadata
          if (!userId && stripeSubscription.customer && typeof stripeSubscription.customer !== 'string') {
            if (!('deleted' in stripeSubscription.customer && stripeSubscription.customer.deleted)) {
              userId = stripeSubscription.customer.metadata?.userId;

              // Update subscription metadata if we found userId in customer
              if (userId) {
                await this.stripe.subscriptions.update(subscriptionId, {
                  metadata: {
                    userId: userId,
                  },
                });
              }
            }
          }

          if (userId) {
            // Create subscription in our database
            await this.subscriptionService.updateSubscriptionTier(
              userId,
              SubscriptionTier.FORENSIC,
              'stripe',
              {
                subscriptionId: stripeSubscription.id,
                customerId: stripeSubscription.customer as string,
                priceId: stripeSubscription.items.data[0]?.price.id || '',
                nextBillingDate: new Date(
                  (stripeSubscription as any).current_period_end * 1000,
                ),
              },
            );
            this.logger.log(
              `Created subscription ${subscriptionId} from invoice payment for user ${userId}`,
            );
            subscription =
              await this.subscriptionService.getSubscriptionByStripeId(
                subscriptionId,
              );
          } else {
            this.logger.warn(
              `Subscription ${subscriptionId} has no userId in metadata or customer metadata`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to fetch/create subscription from invoice: ${error.message}`,
          );
          this.logger.error(`Error details: ${JSON.stringify(error)}`);
        }
      }

      if (subscription) {
        // Ensure subscription is active
        await this.subscriptionService.ensureSubscriptionActive(
          subscription.userId.toString(),
        );
        this.logger.log(
          `Payment succeeded for subscription ${subscriptionId}, invoice ${invoice.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle payment success: ${error.message}`,
      );
    }
  }

  private async handleStripePaymentFailure(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    try {
      const subscriptionId =
        typeof (invoice as any).subscription === 'string'
          ? (invoice as any).subscription
          : (invoice as any).subscription?.id;
      if (!subscriptionId) {
        return;
      }

      this.logger.warn(
        `Payment failed for subscription ${subscriptionId}, invoice ${invoice.id}`,
      );

      // Fetch subscription from Stripe to check its current status
      if (!this.stripe) {
        this.logger.error('Stripe is not initialized');
        return;
      }

      try {
        const stripeSubscription = await this.stripe.subscriptions.retrieve(
          subscriptionId,
        );

        // Check if subscription is in a state that indicates it's no longer active
        // Stripe will retry payments, but if subscription is past_due, unpaid, or canceled,
        // we should downgrade the user
        const inactiveStatuses = [
          'past_due',
          'unpaid',
          'canceled',
          'incomplete_expired',
        ];

        if (inactiveStatuses.includes(stripeSubscription.status)) {
          this.logger.warn(
            `Subscription ${subscriptionId} has status ${stripeSubscription.status}, downgrading user`,
          );

          // Find our subscription record
          const subscription =
            await this.subscriptionService.getSubscriptionByStripeId(
              subscriptionId,
            );

          if (subscription) {
            const userId = subscription.userId.toString();
            await this.subscriptionService.cancelSubscription(userId);
            this.logger.log(
              `Downgraded user ${userId} to Basic tier due to payment failure (status: ${stripeSubscription.status})`,
            );
          } else {
            this.logger.warn(
              `Subscription ${subscriptionId} not found in database`,
            );
          }
        } else {
          this.logger.log(
            `Subscription ${subscriptionId} status is ${stripeSubscription.status}, Stripe will retry payment`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to retrieve subscription ${subscriptionId} from Stripe: ${error.message}`,
        );
      }

      // TODO: Send notification to user about failed payment
    } catch (error) {
      this.logger.error(
        `Failed to handle payment failure: ${error.message}`,
      );
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    try {
      const userId = session.metadata?.userId;
      if (!userId) {
        this.logger.warn(`No userId in checkout session metadata`);
        return;
      }

      this.logger.log(
        `Checkout session completed for user ${userId}, session ${session.id}`,
      );

      // If checkout session has a subscription, fetch it and create/update subscription
      if (session.subscription) {
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;

        if (!this.stripe) {
          this.logger.error('Stripe is not initialized');
          return;
        }

        // Fetch the full subscription object from Stripe
        const subscription = await this.stripe.subscriptions.retrieve(
          subscriptionId,
          {
            expand: ['customer'],
          },
        );

        // Ensure userId is in subscription metadata (update if missing)
        if (!subscription.metadata?.userId) {
          await this.stripe.subscriptions.update(subscriptionId, {
            metadata: {
              userId: userId,
            },
          });
          subscription.metadata = { userId: userId };
          this.logger.log(
            `Updated subscription ${subscriptionId} metadata with userId ${userId}`,
          );
        }

        // Also ensure customer has userId in metadata
        if (subscription.customer && typeof subscription.customer !== 'string') {
          if (!('deleted' in subscription.customer && subscription.customer.deleted)) {
            if (!subscription.customer.metadata?.userId) {
              await this.stripe.customers.update(subscription.customer.id, {
                metadata: {
                  userId: userId,
                },
              });
              this.logger.log(
                `Updated customer ${subscription.customer.id} metadata with userId ${userId}`,
              );
            }
          }
        }

        // Extract customer ID before passing to handler (in case it's expanded)
        const customerIdForHandler =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id || '';

        // Create a copy of subscription with customer as string ID for handler
        const subscriptionForHandler = {
          ...subscription,
          customer: customerIdForHandler,
        } as Stripe.Subscription;

        // Create or update subscription in our database
        await this.handleStripeSubscriptionUpdate(subscriptionForHandler);
      } else {
        this.logger.warn(
          `Checkout session ${session.id} has no subscription associated`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle checkout session completion: ${error.message}`,
      );
    }
  }
}

