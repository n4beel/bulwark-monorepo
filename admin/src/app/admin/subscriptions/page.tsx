'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getCurrentUser, User } from '@/lib/auth';
import {
  getScanStatus,
  createCheckoutSession,
  createLlamaPayCheckout,
  cancelSubscription,
  SubscriptionStatus,
} from '@/lib/subscriptions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function SubscriptionsAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [scanStatus, setScanStatus] = useState<SubscriptionStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'llamapay'>('stripe');

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const storedUser = getStoredUser();
        if (!storedUser?.jwtToken) {
          router.push('/dashboard');
          return;
        }

        // Fetch current user from API
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Fetch scan status
        await fetchScanStatus();
      } catch (error) {
        console.error('Failed to check auth:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchScanStatus = async () => {
    try {
      setError(null);
      const user = getStoredUser();
      if (!user?.jwtToken) {
        throw new Error('Not authenticated');
      }

      const status = await getScanStatus(user.jwtToken);
      setScanStatus(status);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to fetch scan status',
      );
    }
  };

  const handleUpgradeToForensic = async () => {
    try {
      setIsUpgrading(true);
      setError(null);
      setSuccess(null);

      const user = getStoredUser();
      if (!user?.jwtToken) {
        throw new Error('Not authenticated');
      }

      let checkoutUrl: string;

      if (selectedPaymentMethod === 'stripe') {
        // Get Stripe Price ID from environment or use a default
        const priceId =
          process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FORENSIC ||
          'price_1234567890'; // Replace with actual price ID

        // Create Stripe checkout session
        const checkoutData = await createCheckoutSession(
          user.jwtToken,
          priceId,
          `${window.location.origin}/admin/subscriptions?success=true&provider=stripe`,
          `${window.location.origin}/admin/subscriptions?canceled=true&provider=stripe`,
        );
        checkoutUrl = checkoutData.url;
      } else {
        // Create LlamaPay checkout
        // Use $1 for testing (100 cents), change to 5000 ($50) for production
        const amountPerPeriod = process.env.NEXT_PUBLIC_LLAMAPAY_TEST_MODE === 'true' 
          ? 100  // $1.00 for testing
          : 5000; // $50.00 for production
        const checkoutData = await createLlamaPayCheckout(
          user.jwtToken,
          amountPerPeriod,
          undefined, // Use default USDC token
          `${window.location.origin}/admin/subscriptions?success=true&provider=llamapay`,
          `${window.location.origin}/admin/subscriptions?canceled=true&provider=llamapay`,
        );
        checkoutUrl = checkoutData.url;
      }

      // Redirect to payment checkout
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to create checkout session',
      );
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        'Are you sure you want to cancel your subscription? You will be downgraded to Basic tier immediately.',
      )
    ) {
      return;
    }

    try {
      setIsCancelling(true);
      setError(null);
      setSuccess(null);

      const user = getStoredUser();
      if (!user?.jwtToken) {
        throw new Error('Not authenticated');
      }

      await cancelSubscription(user.jwtToken);
      setSuccess('Subscription cancelled successfully. You have been downgraded to Basic tier.');
      await fetchScanStatus();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to cancel subscription',
      );
    } finally {
      setIsCancelling(false);
    }
  };

  // Check for success/cancel redirects from payment providers
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get('provider') || 'stripe';
    if (params.get('success') === 'true') {
      const providerName = provider === 'llamapay' ? 'LlamaPay' : 'Stripe';
      setSuccess(`Payment successful via ${providerName}! Your subscription has been upgraded.`);
      fetchScanStatus();
      window.history.replaceState({}, '', '/admin/subscriptions');
    } else if (params.get('canceled') === 'true') {
      setError('Payment was cancelled. Your subscription was not changed.');
      window.history.replaceState({}, '', '/admin/subscriptions');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading subscription...</p>
        </div>
      </div>
    );
  }

  const isForensic = scanStatus?.tier === 'forensic';
  const scansRemaining =
    scanStatus?.scansRemaining === -1 ? 'Unlimited' : scanStatus?.scansRemaining;
  const scanLimit =
    scanStatus?.scanLimit === -1 ? 'Unlimited' : scanStatus?.scanLimit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Subscription Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your subscription and scan limits
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{success}</span>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-600 hover:text-green-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Current Subscription Status */}
        {scanStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Current Subscription
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tier Badge */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Subscription Tier
                </label>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      isForensic
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {isForensic ? '🔒 Forensic' : '📊 Basic'}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      scanStatus.subscriptionStatus === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {scanStatus.subscriptionStatus === 'active'
                      ? '✓ Active'
                      : scanStatus.subscriptionStatus}
                  </span>
                </div>
              </div>

              {/* Scans Used */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Scans Used This Month
                </label>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {scanStatus.scansUsed} / {scanLimit}
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isForensic
                          ? 'bg-purple-600'
                          : scanStatus.scansRemaining === 0
                            ? 'bg-red-600'
                            : 'bg-blue-600'
                      }`}
                      style={{
                        width: `${
                          isForensic
                            ? 100
                            : scanLimit === 'Unlimited'
                              ? 0
                              : Math.min(
                                  (scanStatus.scansUsed /
                                    (scanStatus.scanLimit || 1)) *
                                    100,
                                  100,
                                )
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Scans Remaining */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Scans Remaining
                </label>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {scansRemaining}
                </div>
                {!isForensic && (
                  <p className="mt-1 text-sm text-gray-500">
                    Resets on{' '}
                    {new Date(scanStatus.resetDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Available Plans
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Plan */}
            <div
              className={`border-2 rounded-lg p-6 ${
                !isForensic
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Basic</h3>
                {!isForensic && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">Free</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  5 scans per month
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Basic analysis features
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Monthly reset
                </li>
              </ul>
            </div>

            {/* Forensic Plan */}
            <div
              className={`border-2 rounded-lg p-6 ${
                isForensic
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Forensic</h3>
                {isForensic && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {selectedPaymentMethod === 'llamapay' && process.env.NEXT_PUBLIC_LLAMAPAY_TEST_MODE === 'true' 
                    ? '$1' 
                    : '$50'}
                </span>
                <span className="text-gray-600">/month</span>
                {selectedPaymentMethod === 'llamapay' && process.env.NEXT_PUBLIC_LLAMAPAY_TEST_MODE === 'true' && (
                  <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                    Test Mode
                  </span>
                )}
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Unlimited scans
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Advanced analysis features
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Priority support
                </li>
              </ul>
              {!isForensic ? (
                <div className="space-y-3">
                  {/* Payment Method Selection */}
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Choose Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedPaymentMethod('stripe')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedPaymentMethod === 'stripe'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        💳 Stripe
                      </button>
                      <button
                        onClick={() => setSelectedPaymentMethod('llamapay')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedPaymentMethod === 'llamapay'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🦙 LlamaPay
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedPaymentMethod === 'stripe'
                        ? 'Pay with credit card via Stripe'
                        : 'Pay with crypto via LlamaPay (Solana)'}
                    </p>
                  </div>
                  <button
                    onClick={handleUpgradeToForensic}
                    disabled={isUpgrading}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isUpgrading
                      ? 'Processing...'
                      : `Upgrade to Forensic (${selectedPaymentMethod === 'stripe' ? 'Stripe' : 'LlamaPay'})`}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={fetchScanStatus}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}


