'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, User, getStoredUser } from '@/lib/auth';

interface UseCurrentUserReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to fetch and manage current user state
 * 
 * Features:
 * - Automatically fetches user on mount
 * - Provides loading and error states
 * - Includes refetch function for manual updates
 * - Syncs with localStorage
 * 
 * @example
 * ```tsx
 * const { user, loading, error, refetch } = useCurrentUser();
 * 
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (!user) return <div>Not authenticated</div>;
 * 
 * return <div>Welcome, {user.name}!</div>;
 * ```
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if there's a stored user with JWT
      const storedUser = getStoredUser();
      if (!storedUser?.jwtToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Fetch latest user data from backend
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user');
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
  };
}

/**
 * Lightweight hook that only returns the stored user (no API call)
 * Use this when you just need to check if user is authenticated
 * without making an API call
 */
export function useStoredUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, []);

  return user;
}


