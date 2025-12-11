import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  Req,
  Res,
  RawBodyRequest,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SubscriptionService, ScanStatus } from './subscription.service';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionTier } from './schemas/subscription.schema';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
  ) { }

  @Get('scan-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user scan status',
    description:
      'Returns the current tier, scans used, scans remaining, and reset date for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns scan status',
    schema: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['basic', 'forensic'] },
        scansUsed: { type: 'number' },
        scansRemaining: { type: 'number' },
        scanLimit: { type: 'number' },
        resetDate: { type: 'string', format: 'date-time' },
        subscriptionStatus: { type: 'string' },
      },
    },
  })
  async getScanStatus(
    @CurrentUser() user: UserDocument,
  ): Promise<ScanStatus> {
    try {
      const userId = String(user._id);
      return await this.subscriptionService.getUserScanStatus(userId);
    } catch (error) {
      this.logger.error(`Failed to get scan status: ${error.message}`);
      throw new HttpException(
        'Failed to get scan status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current subscription',
    description: 'Returns the current subscription details for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns subscription details',
  })
  async getCurrentSubscription(@CurrentUser() user: UserDocument) {
    try {
      const userId = String(user._id);
      const subscription =
        await this.subscriptionService.getUserSubscription(userId);
      const scanStatus =
        await this.subscriptionService.getUserScanStatus(userId);

      return {
        subscription: subscription || null,
        scanStatus,
      };
    } catch (error) {
      this.logger.error(`Failed to get subscription: ${error.message}`);
      throw new HttpException(
        'Failed to get subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create Stripe checkout session',
    description:
      'Creates a Stripe Checkout session for subscription. Returns a URL to redirect the user to Stripe Checkout.',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout session created successfully',
  })
  async createCheckoutSession(
    @CurrentUser() user: UserDocument,
    @Body()
    body: {
      priceId: string;
      successUrl: string;
      cancelUrl: string;
    },
  ) {
    try {
      const userId = String(user._id);
      const userEmail = user.email || user.emails?.[0];

      if (!userEmail) {
        throw new HttpException(
          'User email is required for Stripe checkout',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create or get Stripe customer
      let customerId: string;
      const subscription =
        await this.subscriptionService.getUserSubscription(userId);
      if (subscription?.stripeCustomerId) {
        customerId = subscription.stripeCustomerId;
      } else {
        customerId = await this.paymentService.createStripeCustomer(
          userEmail,
          user.name,
          userId,
        );
      }

      // Create checkout session
      const checkoutUrl = await this.paymentService.createCheckoutSession(
        customerId,
        body.priceId,
        userId,
        body.successUrl,
        body.cancelUrl,
      );

      return {
        success: true,
        url: checkoutUrl,
        customerId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session: ${error.message}`,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create checkout session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create or update subscription',
    description:
      'Creates a new subscription or updates existing subscription to Forensic tier. Used for direct subscription creation (not via Checkout).',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription created/updated successfully',
  })
  async createSubscription(
    @CurrentUser() user: UserDocument,
    @Body()
    body: {
      tier: SubscriptionTier;
      paymentProvider: 'stripe' | 'llamapay';
      paymentData: any;
    },
  ) {
    try {
      const userId = String(user._id);

      // Validate tier
      if (body.tier !== SubscriptionTier.FORENSIC) {
        throw new HttpException(
          'Only Forensic tier can be purchased',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Process payment based on provider
      let paymentData: any;
      if (body.paymentProvider === 'stripe') {
        const stripeData = await this.paymentService.createStripeSubscription(
          userId,
          body.paymentData.customerId,
          body.paymentData.priceId,
        );
        paymentData = stripeData;
      } else if (body.paymentProvider === 'llamapay') {
        const llamapayData = await this.paymentService.createLlamaPayStream(
          userId,
          body.paymentData.senderAddress,
          body.paymentData.tokenAddress,
          body.paymentData.amountPerPeriod,
        );
        paymentData = llamapayData;
      } else {
        throw new HttpException(
          'Invalid payment provider',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Update subscription
      const subscription =
        await this.subscriptionService.updateSubscriptionTier(
          userId,
          body.tier,
          body.paymentProvider,
          paymentData,
        );

      return {
        success: true,
        message: 'Subscription created successfully',
        subscription,
      };
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Cancels the current subscription and downgrades to Basic tier.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
  async cancelSubscription(@CurrentUser() user: UserDocument) {
    try {
      const userId = String(user._id);
      const subscription =
        await this.subscriptionService.cancelSubscription(userId);

      return {
        success: true,
        message: 'Subscription cancelled successfully',
        subscription,
      };
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to cancel subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('webhooks/stripe')
  @ApiOperation({
    summary: 'Stripe webhook endpoint',
    description:
      'Receives webhook events from Stripe. This endpoint should be configured in Stripe dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        this.logger.warn('Missing Stripe signature header');
        return res.status(400).json({ error: 'Missing signature' });
      }

      // Get raw body for signature verification
      // Stripe requires the EXACT raw body bytes to verify the signature
      // Priority: 1) req.body (if Buffer from express.raw), 2) req.rawBody, 3) fail
      let rawBody: Buffer;

      // Check if req.body is a Buffer (from express.raw middleware)
      if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;
        this.logger.debug(`✓ Using req.body Buffer (length: ${rawBody.length})`);
      } else if (req.rawBody) {
        // Use req.rawBody (from NestJS rawBody: true verify function)
        rawBody = Buffer.isBuffer(req.rawBody)
          ? req.rawBody
          : typeof req.rawBody === 'string'
            ? Buffer.from(req.rawBody, 'utf8')
            : Buffer.from(String(req.rawBody), 'utf8');

        this.logger.debug(`✓ Using req.rawBody (type: ${typeof req.rawBody}, length: ${rawBody.length})`);
      } else {
        // Raw body not available - this means body was parsed before reaching handler
        this.logger.error('❌ Raw body not available - Stripe webhook signature verification will fail');
        this.logger.error('Diagnostics:');
        this.logger.error(`  - req.body type: ${typeof req.body}`);
        this.logger.error(`  - req.body isBuffer: ${Buffer.isBuffer(req.body)}`);
        this.logger.error(`  - req.rawBody exists: ${!!req.rawBody}`);
        this.logger.error(`  - Content-Type: ${req.headers['content-type']}`);
        this.logger.error(`  - Request path: ${req.path}`);

        // Check if body was parsed (it's an object, not a Buffer)
        if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
          this.logger.error('⚠️  Body has been parsed as JSON - this breaks Stripe signature verification');
          this.logger.error('Possible causes:');
          this.logger.error('  1. Reverse proxy (Cloudflare/nginx) is parsing JSON');
          this.logger.error('  2. NestJS body parser ran before express.raw() middleware');
          this.logger.error('  3. Middleware order issue');
          this.logger.error('');
          this.logger.error('Solution: Configure reverse proxy to pass raw body, or ensure express.raw() runs first');
        }

        // Fail with clear error - don't try to use parsed body
        return res.status(400).json({
          error: 'Webhook Error: Raw body not available. The request body must be preserved as raw bytes for signature verification. If using a reverse proxy (Cloudflare/nginx), configure it to pass through the raw body without parsing JSON.'
        });
      }

      // Ensure rawBody is a Buffer (should already be, but double-check)
      if (!Buffer.isBuffer(rawBody)) {
        rawBody = Buffer.from(String(rawBody), 'utf8');
      }

      this.logger.debug(`Raw body ready for verification (${rawBody.length} bytes)`);

      // Construct and verify webhook event
      const event = this.paymentService.constructWebhookEvent(
        rawBody,
        signature,
      );

      // Handle the webhook event
      await this.paymentService.handleStripeWebhook(event);

      // Return 200 to acknowledge receipt
      return res.json({ received: true });
    } catch (error) {
      this.logger.error(`Stripe webhook error: ${error.message}`);
      return res.status(400).json({ error: `Webhook Error: ${error.message}` });
    }
  }

  @Post('create-llamapay-checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create LlamaPay payment link' })
  async createLlamaPayCheckout(
    @CurrentUser() user: UserDocument,
    @Body()
    body: {
      amountPerPeriod: number; // Amount in USD cents (e.g., 5000 = $50.00)
      tokenAddress?: string; // Optional: specific token address
      successUrl?: string;
      cancelUrl?: string;
    },
  ) {
    try {
      const userId = String(user._id);
      const llamapayData = await this.paymentService.createLlamaPayStream(
        userId,
        body.amountPerPeriod,
        body.tokenAddress,
        body.successUrl,
        body.cancelUrl,
      );

      return { url: llamapayData.hostedUrl, chargeId: llamapayData.chargeId };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create LlamaPay payment link',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('webhooks/llamapay')
  @ApiOperation({ summary: 'LlamaPay webhook endpoint' })
  async handleLlamaPayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Body() body: any,
  ) {
    try {
      // LlamaPay sends signature in X-CC-WEBHOOK-SIGNATURE header (case-insensitive)
      const signature =
        (req.headers['x-cc-webhook-signature'] as string) ||
        (req.headers['X-CC-WEBHOOK-SIGNATURE'] as string);

      // Get raw body for signature verification (must use raw body, not parsed JSON)
      // express.raw() middleware sets req.body to a Buffer for webhook routes
      let rawBody: Buffer | string;
      
      if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;
        this.logger.debug(`✓ Using req.body Buffer (length: ${rawBody.length})`);
      } else if (req.rawBody) {
        rawBody = Buffer.isBuffer(req.rawBody) 
          ? req.rawBody 
          : Buffer.from(String(req.rawBody), 'utf8');
        this.logger.debug(`✓ Using req.rawBody (length: ${rawBody.length})`);
      } else {
        this.logger.error('No raw body received in LlamaPay webhook');
        this.logger.error(`  - req.body type: ${typeof req.body}, isBuffer: ${Buffer.isBuffer(req.body)}`);
        this.logger.error(`  - req.rawBody exists: ${!!req.rawBody}`);
        return res.status(400).json({ error: 'No body received' });
      }
      
      // Ensure rawBody is a Buffer
      if (!Buffer.isBuffer(rawBody)) {
        rawBody = Buffer.from(String(rawBody), 'utf8');
      }

      // Verify webhook signature if secret is configured
      const webhookSecret = process.env.LLAMAPAY_WEBHOOK_SECRET;

      if (webhookSecret) {
        if (!signature) {
          this.logger.warn('LlamaPay webhook secret configured but no X-CC-WEBHOOK-SIGNATURE header found');
          return res.status(401).json({ error: 'No signature provided' });
        }

        // Verify webhook signature
        const isValid = this.paymentService.verifyLlamaPayWebhook(
          rawBody,
          signature,
        );

        if (!isValid) {
          this.logger.warn(`Invalid LlamaPay webhook signature`);
          this.logger.debug(`Received signature: ${signature.substring(0, 20)}...`);
          return res.status(401).json({ error: 'Invalid signature' });
        }

        this.logger.log('LlamaPay webhook signature verified successfully');
      } else {
        this.logger.warn('LLAMAPAY_WEBHOOK_SECRET not configured - skipping signature verification');
      }

      // Parse body if it's a Buffer
      const eventData = Buffer.isBuffer(body) ? JSON.parse(body.toString()) : body;

      // LlamaPay webhook structure: { event: { type, data, ... } }
      const eventType = eventData?.event?.type || eventData?.type;
      const eventId = eventData?.event?.id || eventData?.id;
      const eventDataPayload = eventData?.event?.data || eventData?.data;
      const chargeId = eventDataPayload?.id || eventData?.id;

      this.logger.log(`Processing LlamaPay webhook event: ${eventType} (event ID: ${eventId}, charge ID: ${chargeId})`);

      // Handle the webhook event asynchronously to avoid blocking the response
      // LlamaPay requires HTTP 200 response, so we acknowledge immediately
      // and process the event in the background
      // This prevents LlamaPay from retrying (they retry for 3 days if not 200)
      this.paymentService.handleLlamaPayEvent(eventData).catch((error) => {
        // Log errors but don't fail the webhook response
        this.logger.error(`Error processing LlamaPay webhook event: ${error.message}`);
        this.logger.error(`Event ID: ${eventId}, Charge ID: ${chargeId}, Error stack: ${error.stack}`);
      });

      // Return 200 immediately to acknowledge receipt (LlamaPay will stop retrying)
      // According to LlamaPay docs, they retry for 3 days with exponential backoff if not 200
      return res.status(200).json({ received: true, eventId });
    } catch (error) {
      // Even if there's an error, return 200 to stop retries
      // Log the error for debugging
      this.logger.error(`LlamaPay webhook error: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);

      // Return 200 to prevent LlamaPay from retrying
      // The error is logged, but we don't want infinite retries
      return res.status(200).json({
        received: true,
        error: 'Webhook processed but encountered an error',
        message: error.message
      });
    }
  }
}

