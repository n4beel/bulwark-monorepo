import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private configService: ConfigService) { }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const clientId = this.configService.get<string>('GIT_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'GIT_CLIENT_SECRET',
      );

      if (!clientId || !clientSecret) {
        throw new Error('GitHub OAuth credentials not configured');
      }

      const response = await axios.post<GitHubTokenResponse>(
        'https://github.com/login/oauth/access_token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.error) {
        throw new Error(
          `GitHub OAuth error: ${response.data.error_description || response.data.error}`,
        );
      }

      if (!response.data.access_token) {
        throw new Error('No access token received from GitHub');
      }

      return response.data.access_token;
    } catch (error) {
      this.logger.error(`Failed to exchange code for token: ${error.message}`);
      throw new Error('Failed to authenticate with GitHub');
    }
  }

  /**
   * Get GitHub user information using access token
   */
  async getGitHubUser(accessToken: string): Promise<GitHubUser> {
    try {
      const response = await axios.get<GitHubUser>(
        'https://api.github.com/user',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get GitHub user: ${error.message}`);
      throw new Error('Failed to get user information from GitHub');
    }
  }

  /**
   * Generate GitHub OAuth URL
   * @param fromPath - Path to redirect to after authentication
   * @param mode - OAuth mode (passed through to frontend, not used for backend logic)
   * @param reportId - Optional report ID to associate with user
   * @param userId - Optional user ID for account linking (when user is already authenticated)
   */
  getGitHubAuthUrl(fromPath?: string, mode?: string, reportId?: string, userId?: string): string {
    this.logger.log(`Generating GitHub Auth URL - fromPath: ${fromPath}, mode: ${mode}, linking: ${!!userId}`);

    const clientId = this.configService.get<string>('GIT_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GIT_CALLBACK_URL');

    if (!clientId || !redirectUri) {
      throw new Error('GitHub OAuth credentials not configured');
    }

    // Build state object - mode is passed through for frontend use only
    const state = {
      path: fromPath || '/',
      reportId: reportId || '',
      userId: userId || '',
      mode: mode || 'auth', // Default to 'auth' if not provided
    };

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo read:user user:email',
      state: JSON.stringify(state),
    });

    const fullUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    this.logger.log(`🔍 Full GitHub OAuth URL: ${fullUrl}`);

    return fullUrl;
  }

  /**
   * Generate a random state parameter for OAuth security
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Generate Google OAuth URL
   * @param fromPath - Path to redirect to after authentication
   * @param mode - OAuth mode (passed through to frontend, not used for backend logic)
   * @param reportId - Optional report ID to associate with user
   * @param userId - Optional user ID for account linking (when user is already authenticated)
   */
  getGoogleAuthUrl(fromPath?: string, mode?: string, reportId?: string, origin?: string, userId?: string): string {
    this.logger.log(`Generating Google Auth URL - fromPath: ${fromPath}, mode: ${mode}, linking: ${!!userId}`);

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientId || !redirectUri) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Build state object - mode is passed through for frontend use only
    const state = {
      path: fromPath || '/',
      reportId: reportId || '',
      userId: userId || '',
      mode: mode || 'auth', // Default to 'auth' if not provided
      origin: origin || '',
    };

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      state: JSON.stringify(state),
    });

    const fullUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    this.logger.log(`🔍 Full Google OAuth URL: ${fullUrl}`);

    return fullUrl;
  }

  /**
   * Exchange Google authorization code for access token
   */
  async exchangeGoogleCodeForToken(code: string): Promise<string> {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
      const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');

      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Google OAuth credentials not configured');
      }

      const response = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data.error) {
        throw new Error(
          `Google OAuth error: ${response.data.error_description || response.data.error}`,
        );
      }

      if (!response.data.access_token) {
        throw new Error('No access token received from Google');
      }

      return response.data.access_token;
    } catch (error) {
      this.logger.error(`Failed to exchange Google code for token: ${error.message}`);
      throw new Error('Failed to authenticate with Google');
    }
  }

  /**
   * Get Google user information using access token
   */
  async getGoogleUser(accessToken: string): Promise<GoogleUser> {
    try {
      const response = await axios.get<GoogleUser>(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Google user: ${error.message}`);
      throw new Error('Failed to get user information from Google');
    }
  }
}
