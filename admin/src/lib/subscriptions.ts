import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface SubscriptionStatus {
  tier: 'basic' | 'forensic';
  scansUsed: number;
  scansRemaining: number;
  scanLimit: number;
  resetDate: string;
  subscriptionStatus: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  url: string;
  customerId: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
}

/**
 * Get user's scan status and subscription info
 */
export async function getScanStatus(
  jwtToken: string,
): Promise<SubscriptionStatus> {
  try {
    const response = await axios.get<SubscriptionStatus>(
      `${API_URL}/subscriptions/scan-status`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to get scan status:', error);
    throw error;
  }
}

/**
 * Create Stripe checkout session for subscription upgrade
 */
export async function createCheckoutSession(
  jwtToken: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<CheckoutSessionResponse> {
  try {
    const response = await axios.post<CheckoutSessionResponse>(
      `${API_URL}/subscriptions/create-checkout-session`,
      {
        priceId,
        successUrl,
        cancelUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
}

/**
 * Cancel user's subscription
 */
export async function cancelSubscription(
  jwtToken: string,
): Promise<CancelSubscriptionResponse> {
  try {
    const response = await axios.post<CancelSubscriptionResponse>(
      `${API_URL}/subscriptions/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }
}

/**
 * Create LlamaPay checkout session for subscription upgrade
 */
export async function createLlamaPayCheckout(
  jwtToken: string,
  amountPerPeriod: number, // Amount in USD cents (e.g., 5000 = $50.00)
  tokenAddress?: string,
  successUrl?: string,
  cancelUrl?: string,
): Promise<{ url: string; chargeId: string }> {
  try {
    const response = await axios.post<{ url: string; chargeId: string }>(
      `${API_URL}/subscriptions/create-llamapay-checkout`,
      { amountPerPeriod, tokenAddress, successUrl, cancelUrl },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to create LlamaPay checkout:', error);
    throw error;
  }
}

/**
 * Get current subscription details
 */
export async function getCurrentSubscription(
  jwtToken: string,
): Promise<any> {
  try {
    const response = await axios.get(`${API_URL}/subscriptions/current`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to get current subscription:', error);
    throw error;
  }
}


