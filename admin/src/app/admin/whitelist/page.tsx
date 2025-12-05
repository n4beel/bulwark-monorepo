'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getCurrentUser, User } from '@/lib/auth';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface WhitelistResponse {
    emails: string[];
}

interface AddEmailsResponse {
    message: string;
    added: string[];
    skipped: string[];
}

interface RemoveEmailsResponse {
    message: string;
    removed: string[];
    notFound: string[];
}

export default function WhitelistAdminPage() {
    const router = useRouter();
    const [emails, setEmails] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [addEmailsInput, setAddEmailsInput] = useState('');
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
    const [isAdding, setIsAdding] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        // Check if user is admin by fetching current user from API
        const checkAdminAndFetch = async () => {
            try {
                const storedUser = getStoredUser();
                if (!storedUser?.jwtToken) {
                    router.push('/dashboard');
                    return;
                }

                // Fetch current user from API to get latest admin status
                const currentUser = await getCurrentUser();
                if (!currentUser || !currentUser.admin) {
                    router.push('/dashboard');
                    return;
                }

                // User is admin, fetch whitelist
                await fetchWhitelist();
            } catch (error) {
                console.error('Failed to check admin status:', error);
                router.push('/dashboard');
            }
        };

        checkAdminAndFetch();
    }, [router]);

    const fetchWhitelist = async () => {
        try {
            setLoading(true);
            setError(null);
            const user = getStoredUser();

            if (!user?.jwtToken) {
                throw new Error('Not authenticated');
            }

            const response = await axios.get<WhitelistResponse>(`${API_URL}/whitelist`, {
                headers: {
                    Authorization: `Bearer ${user.jwtToken}`,
                },
            });

            setEmails(response.data.emails.sort());
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch whitelist');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmails = async () => {
        if (!addEmailsInput.trim()) {
            setError('Please enter at least one email');
            return;
        }

        try {
            setIsAdding(true);
            setError(null);
            setSuccess(null);
            const user = getStoredUser();

            if (!user?.jwtToken) {
                throw new Error('Not authenticated');
            }

            const response = await axios.post<AddEmailsResponse>(
                `${API_URL}/whitelist`,
                { emails: addEmailsInput },
                {
                    headers: {
                        Authorization: `Bearer ${user.jwtToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setAddEmailsInput('');
            setSuccess(
                `Added ${response.data.added.length} email(s). ${response.data.skipped.length > 0 ? `${response.data.skipped.length} skipped (duplicates or invalid).` : ''}`
            );
            await fetchWhitelist();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to add emails');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveEmails = async () => {
        if (selectedEmails.size === 0) {
            setError('Please select at least one email to remove');
            return;
        }

        try {
            setIsRemoving(true);
            setError(null);
            setSuccess(null);
            const user = getStoredUser();

            if (!user?.jwtToken) {
                throw new Error('Not authenticated');
            }

            const emailsToRemove = Array.from(selectedEmails).join(',');
            const response = await axios.delete<RemoveEmailsResponse>(
                `${API_URL}/whitelist`,
                {
                    data: { emails: emailsToRemove },
                    headers: {
                        Authorization: `Bearer ${user.jwtToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setSelectedEmails(new Set());
            setSuccess(
                `Removed ${response.data.removed.length} email(s). ${response.data.notFound.length > 0 ? `${response.data.notFound.length} not found.` : ''}`
            );
            await fetchWhitelist();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to remove emails');
        } finally {
            setIsRemoving(false);
        }
    };

    const toggleEmailSelection = (email: string) => {
        const newSelected = new Set(selectedEmails);
        if (newSelected.has(email)) {
            newSelected.delete(email);
        } else {
            newSelected.add(email);
        }
        setSelectedEmails(newSelected);
    };

    const selectAll = () => {
        if (selectedEmails.size === emails.length) {
            setSelectedEmails(new Set());
        } else {
            setSelectedEmails(new Set(emails));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading whitelist...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Whitelist Management</h1>
                            <p className="text-gray-600 mt-1">Manage whitelisted emails for analysis access</p>
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
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{success}</span>
                        </div>
                    </div>
                )}

                {/* Add Emails Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Add Emails</h2>
                    <p className="text-gray-600 mb-4 text-sm">
                        Enter comma-separated email addresses to add to the whitelist
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={addEmailsInput}
                            onChange={(e) => setAddEmailsInput(e.target.value)}
                            placeholder="email1@example.com, email2@example.com"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddEmails();
                                }
                            }}
                        />
                        <button
                            onClick={handleAddEmails}
                            disabled={isAdding}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {isAdding ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </div>

                {/* Email List Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            Whitelisted Emails ({emails.length})
                        </h2>
                        <div className="flex gap-2">
                            {emails.length > 0 && (
                                <>
                                    <button
                                        onClick={selectAll}
                                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        {selectedEmails.size === emails.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <button
                                        onClick={handleRemoveEmails}
                                        disabled={isRemoving || selectedEmails.size === 0}
                                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        {isRemoving ? 'Removing...' : `Remove (${selectedEmails.size})`}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {emails.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-lg font-medium">No whitelisted emails</p>
                            <p className="text-sm mt-2">Add emails above to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {emails.map((email) => (
                                <div
                                    key={email}
                                    className={`flex items-center p-3 rounded-lg border transition-colors ${selectedEmails.has(email)
                                            ? 'bg-blue-50 border-blue-300'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedEmails.has(email)}
                                        onChange={() => toggleEmailSelection(email)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mr-3"
                                    />
                                    <span className="flex-1 text-gray-900 font-mono text-sm">{email}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

