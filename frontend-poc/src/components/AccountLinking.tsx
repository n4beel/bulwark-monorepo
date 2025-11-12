'use client';

import { useState } from 'react';
import { getGitHubLinkUrl, getGoogleLinkUrl, User } from '@/lib/auth';

interface AccountLinkingProps {
  user: User;
}

export default function AccountLinking({ user }: AccountLinkingProps) {
  const [loading, setLoading] = useState<'github' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasGitHub = !!user.githubId;
  const hasGoogle = !!user.googleId;
  const hasBothAccounts = hasGitHub && hasGoogle;

  const handleLinkGitHub = async () => {
    setLoading('github');
    setError(null);
    try {
      const linkUrl = await getGitHubLinkUrl(user.id);
      window.location.href = linkUrl;
    } catch (err) {
      setError('Failed to initiate GitHub linking');
      setLoading(null);
    }
  };

  const handleLinkGoogle = async () => {
    setLoading('google');
    setError(null);
    try {
      const linkUrl = await getGoogleLinkUrl(user.id);
      window.location.href = linkUrl;
    } catch (err) {
      setError('Failed to initiate Google linking');
      setLoading(null);
    }
  };

  if (hasBothAccounts) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Linking</h2>
        <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
          <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-green-900">All accounts connected!</p>
            <p className="text-sm text-green-700">You've linked both GitHub and Google accounts.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Linking</h2>
      <p className="text-gray-600 mb-6">
        Connect additional accounts to access all your data in one place.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {!hasGitHub && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-8 h-8 mr-3 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">GitHub</p>
                  <p className="text-sm text-gray-600">Connect your GitHub account</p>
                </div>
              </div>
              <button
                onClick={handleLinkGitHub}
                disabled={loading !== null}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {loading === 'github' ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        )}

        {!hasGoogle && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Google</p>
                  <p className="text-sm text-gray-600">Connect your Google account</p>
                </div>
              </div>
              <button
                onClick={handleLinkGoogle}
                disabled={loading !== null}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {loading === 'google' ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Account Linking</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>If the account is already linked elsewhere, accounts will be merged</li>
              <li>The older account will be kept as the primary account</li>
              <li>All data from both accounts will be preserved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

