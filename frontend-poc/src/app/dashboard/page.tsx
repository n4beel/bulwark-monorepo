'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UserProfile from '@/components/UserProfile';
import AccountLinking from '@/components/AccountLinking';
import { getStoredUser, clearUser, storeUser, User } from '@/lib/auth';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check for updated user data from OAuth callback
    const userParam = searchParams.get('user');
    const token = searchParams.get('token');

    if (userParam && token) {
      try {
        const updatedUser: User = JSON.parse(decodeURIComponent(userParam));
        storeUser(updatedUser);
        setUser(updatedUser);

        // Show success message if account was linked
        if (updatedUser.linkedAccount) {
          setMessage({
            type: 'success',
            text: 'Account linked successfully! Your accounts have been merged.',
          });

          // Clear the message after 5 seconds
          setTimeout(() => setMessage(null), 5000);
        }

        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
      } catch (err) {
        console.error('Failed to parse user data:', err);
        setMessage({
          type: 'error',
          text: 'Failed to update user data',
        });
      }
    } else {
      // Load user from localStorage
      const storedUser = getStoredUser();
      if (!storedUser) {
        router.push('/');
        return;
      }
      setUser(storedUser);
    }

    setLoading(false);
  }, [searchParams, router]);

  const handleLogout = () => {
    clearUser();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your account and connected services</p>
            </div>
            <div className="flex gap-2">
              {user.admin && (
                <button
                  onClick={() => router.push('/admin/whitelist')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Admin
                </button>
              )}
              <button
                onClick={() => router.push('/profile')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
              }`}
          >
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* User Profile */}
        <UserProfile user={user} />

        {/* Account Linking */}
        <AccountLinking user={user} />

        {/* Repository Analysis Section */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Repository Analysis</h2>
          <p className="text-gray-600 mb-4">
            Analyze Rust smart contracts for security vulnerabilities and complexity metrics.
            {user.githubId
              ? ' Select from your repositories or analyze any public repository.'
              : ' Analyze any public GitHub repository.'
            }
          </p>
          <button
            onClick={() => router.push('/analyze')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Analyze Repository
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About This POC</h2>
          <div className="prose prose-sm text-gray-600">
            <p className="mb-3">
              This is a proof-of-concept demonstrating dual OAuth authentication (GitHub and Google)
              with account linking and merging capabilities.
            </p>
            <p className="mb-3">
              <strong>Key Features:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3">
              <li>Login with GitHub or Google OAuth</li>
              <li>Link multiple OAuth providers to a single account</li>
              <li>Automatic account merging when linking an already-connected provider</li>
              <li>Data preservation from both accounts during merge</li>
              <li>JWT-based session management</li>
            </ul>
            <p>
              The backend handles all OAuth flows, account linking logic, and database operations.
              The frontend provides a clean UI for authentication and account management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

