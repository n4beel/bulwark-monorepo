'use client';

import { useState } from 'react';
import { Github, ArrowRight } from 'lucide-react';
import { authApi } from '@/services/api';

interface GitHubAuthProps {
    onAuth: (token: string) => void;
    isLoading?: boolean;
}

export default function GitHubAuth({ onAuth, isLoading = false }: GitHubAuthProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const handleGitHubLogin = async () => {
        setIsConnecting(true);
        setError('');

        try {
            // Get GitHub OAuth URL
            const { authUrl } = await authApi.getGitHubAuthUrl();

            // Redirect to GitHub OAuth
            window.location.href = authUrl;
        } catch (err) {
            setError('Failed to initiate GitHub login. Please try again.');
            console.error('GitHub OAuth error:', err);
            setIsConnecting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center mb-6">
                    <Github className="w-12 h-12 text-gray-900 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">GitHub Authentication</h2>
                    <p className="text-gray-600 mt-2">
                        Connect your GitHub account to access your repositories securely
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={handleGitHubLogin}
                        disabled={isConnecting || isLoading}
                        className="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isConnecting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <Github className="w-4 h-4 mr-2" />
                                Continue with GitHub
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        We only request access to your public repositories and basic profile information
                    </p>
                </div>
            </div>
        </div>
    );
}
