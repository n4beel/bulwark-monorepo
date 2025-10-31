'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const errorMessage = searchParams.get('message');

        if (errorMessage) {
            setError(decodeURIComponent(errorMessage));
            setStatus('error');
            return;
        }

        if (!token) {
            setError('No access token received from GitHub');
            setStatus('error');
            return;
        }

        try {
            // Store the token and user info in localStorage
            localStorage.setItem('github_token', token);

            if (userParam) {
                const user = JSON.parse(decodeURIComponent(userParam));
                localStorage.setItem('github_user', JSON.stringify(user));
            }

            setStatus('success');

            // Redirect to main page after a short delay
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch {
            setError('Failed to process authentication response');
            setStatus('error');
        }
    }, [searchParams, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Authentication</h2>
                    <p className="text-gray-600">Please wait while we complete your GitHub login...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Successful!</h2>
                <p className="text-gray-600 mb-4">You have been successfully authenticated with GitHub.</p>
                <p className="text-sm text-gray-500">Redirecting to the main page...</p>
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading...</p>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <AuthCallbackContent />
        </Suspense>
    );
}
