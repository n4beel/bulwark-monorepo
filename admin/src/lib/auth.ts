import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface User {
  id: string;
  githubId?: number;
  githubUsername?: string;
  googleId?: string;
  googleEmail?: string;
  email?: string; // Primary email (backward compatibility)
  emails?: string[]; // Array of all emails from all providers
  name?: string;
  avatarUrl?: string;
  jwtToken?: string;
  mode?: string;
  linkedAccount?: boolean;
  reportId?: string;
  from?: string;
  admin?: boolean;
}

export interface AuthResponse {
  authUrl: string;
}

/**
 * Get GitHub OAuth URL
 * @param from - Path to redirect to after authentication
 * @param mode - OAuth mode: 'auth' for new login, 'connect' for linking additional provider
 * @param reportId - Optional report ID to associate with user
 * @param jwtToken - Optional JWT token for authenticated requests (required for 'connect' mode)
 */
export async function getGitHubAuthUrl(
  from: string = '/dashboard',
  mode: string = 'auth',
  reportId?: string,
  jwtToken?: string
): Promise<string> {
  try {
    const params = new URLSearchParams({ from, mode });
    if (reportId) params.append('reportId', reportId);

    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }

    const response = await axios.get<AuthResponse>(
      `${API_URL}/auth/github/url?${params.toString()}`,
      { headers }
    );
    return response.data.authUrl;
  } catch (error) {
    console.error('Failed to get GitHub auth URL:', error);
    throw error;
  }
}

/**
 * Get Google OAuth URL
 * @param from - Path to redirect to after authentication
 * @param mode - OAuth mode: 'auth' for new login, 'connect' for linking additional provider
 * @param reportId - Optional report ID to associate with user
 * @param jwtToken - Optional JWT token for authenticated requests (required for 'connect' mode)
 */
export async function getGoogleAuthUrl(
  from: string = '/dashboard',
  mode: string = 'auth',
  reportId?: string,
  jwtToken?: string
): Promise<string> {
  try {
    const params = new URLSearchParams({ from, mode });
    if (reportId) params.append('reportId', reportId);

    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }

    const response = await axios.get<AuthResponse>(
      `${API_URL}/auth/google/url?${params.toString()}`,
      { headers }
    );
    return response.data.authUrl;
  } catch (error) {
    console.error('Failed to get Google auth URL:', error);
    throw error;
  }
}

/**
 * Get current user from backend
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const storedUser = getStoredUser();
    if (!storedUser?.jwtToken) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get<User>(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${storedUser.jwtToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get current user:', error);
    throw error;
  }
}

/**
 * Store user in localStorage
 */
export function storeUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

/**
 * Get user from localStorage
 */
export function getStoredUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Clear user from localStorage
 */
export function clearUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const user = getStoredUser();
  return user !== null && (!!user.githubId || !!user.googleId);
}

/**
 * Get user's GitHub access token
 * Note: In a real implementation, this would come from the backend
 * For this POC, we'll need to add this to the User interface after OAuth
 */
export function getGitHubToken(): string | null {
  const user = getStoredUser();
  return user?.jwtToken || null;
}

// Analysis Types
export interface AnalysisRequest {
  owner: string;
  repo: string;
  accessToken?: string;
  selectedFiles?: string[];
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface AnalysisReport {
  _id: string;
  repository: string;
  repositoryUrl: string;
  language: string;
  framework: string;
  commitHash?: string;
  commitUrl?: string;
  static_analysis_scores?: {
    structural: any;
    security: any;
    systemic: any;
    economic: any;
  };
  rust_analysis?: {
    engine: string;
    version: string;
    success: boolean;
    error: string | null;
    total_lines_of_code: number;
    total_functions: number;
  };
  ai_analysis?: {
    engine: string;
    version: string;
    success: boolean;
    error: string | null;
    documentation_clarity: number;
    testing_coverage: number;
    financial_logic_complexity: number;
    attack_vector_risk: number;
    value_at_risk: number;
  };
  performance: {
    analysisTime: number;
    memoryUsage: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch user's GitHub repositories
 */
export async function fetchUserRepositories(accessToken: string): Promise<GitHubRepo[]> {
  try {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      params: {
        sort: 'updated',
        per_page: 100,
        affiliation: 'owner,collaborator',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch repositories:', error);
    throw error;
  }
}

/**
 * Analyze a repository (public or private)
 */
export async function analyzeRepository(request: AnalysisRequest): Promise<AnalysisReport> {
  try {
    const user = getStoredUser();
    const headers: any = {
      'Content-Type': 'application/json',
    };

    // Add JWT token if user is authenticated
    if (user?.jwtToken) {
      headers.Authorization = `Bearer ${user.jwtToken}`;
    }

    const response = await axios.post(
      `${API_URL}/static-analysis/analyze-rust-contract`,
      request,
      { headers }
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to analyze repository:', error);
    throw error;
  }
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/\?#]+)/i,  // https://github.com/owner/repo
      /^([^\/]+)\/([^\/]+)$/,                  // owner/repo
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''), // Remove .git extension if present
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

