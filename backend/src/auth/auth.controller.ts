import {
  Controller,
  Get,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { StaticAnalysisService } from 'src/static-analysis/static-analysis.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private staticAnalysisService: StaticAnalysisService,
  ) { }

  /**
   * Get GitHub OAuth URL
   */
  @Get('github/url')
  @ApiOperation({ summary: 'Get GitHub OAuth URL' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'mode', required: false, type: String })
  @ApiQuery({ name: 'reportId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns the GitHub OAuth URL.' })
  @ApiResponse({ status: 500, description: 'Failed to generate GitHub auth URL.' })
  getGitHubAuthUrl(@Query('from') from: string, @Query('mode') mode: string, @Query('reportId') reportId: string) {
    try {
      const authUrl = this.authService.getGitHubAuthUrl(from, mode, reportId);
      return { authUrl };
    } catch (error) {
      throw new HttpException(
        'Failed to generate GitHub auth URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GitHub OAuth callback
   */
  @Get('github/callback')
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiQuery({ name: 'code', required: true, type: String })
  @ApiQuery({ name: 'state', required: true, type: String })
  @ApiResponse({ status: 302, description: 'Redirects to the frontend with a JWT token.' })
  @ApiResponse({ status: 500, description: 'GitHub OAuth callback error.' })
  async handleGitHubCallback(
    @Query('code') code: string,
    @Query('state') state: string, // <-- This will be '/dashboard'
    @Res() res: Response,
  ) {
    try {
      // Exchange code for GitHub access token
      const accessToken = await this.authService.exchangeCodeForToken(code);

      // Get GitHub user info
      const githubUser = await this.authService.getGitHubUser(accessToken);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const stateObject = JSON.parse(state);

      const returnPath = stateObject.path || '/';
      const mode = stateObject.mode || 'auth';
      const reportId = stateObject.reportId || '';

      console.log("🚀 ~ AuthController ~ handleGitHubCallback ~ mode:", mode)

      let user;
      let linkedAccount = false;

      // Check if this is a linking request
      if (mode === 'link' && reportId) {
        // reportId is actually userId in link mode
        const userId = reportId;

        // Check if this GitHub account already exists
        const existingGithubUser = await this.userService.findByGitHubId(githubUser.id);

        if (existingGithubUser && String(existingGithubUser._id) !== userId) {
          // GitHub account exists and belongs to a different user - need to merge
          const primaryUser = await this.userService.findById(userId);

          if (!primaryUser) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
          }

          // Determine which account is older
          const primaryUserId = existingGithubUser.createdAt < primaryUser.createdAt
            ? String(existingGithubUser._id)
            : userId;
          const secondaryUserId = existingGithubUser.createdAt < primaryUser.createdAt
            ? userId
            : String(existingGithubUser._id);

          // Merge accounts
          user = await this.userService.mergeAccounts(primaryUserId, secondaryUserId);
          linkedAccount = true;
        } else if (existingGithubUser && String(existingGithubUser._id) === userId) {
          // Already linked to this user
          user = existingGithubUser;
          linkedAccount = true;
        } else {
          // Link the GitHub account to the current user
          user = await this.userService.linkGitHubAccount(userId, githubUser);
          linkedAccount = true;
        }
      } else {
        // Normal auth flow - find or create user
        user = await this.userService.findOrCreateUser(githubUser);
      }

      // Generate JWT token
      const jwtToken = this.userService.generateToken(user);

      console.log("====================================================")
      console.log("CHECKING FOR REPORT ID");
      console.log("====================================================")

      try {
        if (reportId && reportId !== '' && mode !== 'link') {
          console.log("====================================================")
          console.log("ASSOCIATING REPORT WITH USER");
          console.log("====================================================")
          const report = await this.staticAnalysisService.associateReportWithUser(reportId, String(user._id));
          console.log("🚀 ~ AuthController ~ handleGitHubCallback ~ report:", report)
        }
      } catch (error) {
        console.error('Failed to associate report with user:', error);
      }

      // Redirect with JWT token
      const redirectUrl = `${frontendUrl}${returnPath}?token=${encodeURIComponent(accessToken)}&user=${encodeURIComponent(JSON.stringify({
        id: String(user._id),
        githubId: user.githubId,
        githubUsername: user.githubUsername,
        googleId: user.googleId,
        googleEmail: user.googleEmail,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        jwtToken: jwtToken,
        mode: mode,
        linkedAccount: linkedAccount,
        reportId: reportId,
        from: returnPath,
      }))}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`;
      res.redirect(errorUrl);
    }
  }

  /**
   * Validate access token
   */
  @Get('validate')
  @ApiOperation({ summary: 'Validate access token' })
  @ApiQuery({ name: 'token', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Returns whether the token is valid and the user info.' })
  async validateToken(@Query('token') token: string) {
    try {
      if (!token) {
        throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.authService.getGitHubUser(token);
      return { valid: true, user };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get Google OAuth URL
   */
  @Get('google/url')
  @ApiOperation({ summary: 'Get Google OAuth URL' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'mode', required: false, type: String })
  @ApiQuery({ name: 'reportId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns the Google OAuth URL.' })
  @ApiResponse({ status: 500, description: 'Failed to generate Google auth URL.' })
  getGoogleAuthUrl(@Query('from') from: string, @Query('mode') mode: string, @Query('reportId') reportId: string) {
    try {
      const authUrl = this.authService.getGoogleAuthUrl(from, mode, reportId);
      return { authUrl };
    } catch (error) {
      throw new HttpException(
        'Failed to generate Google auth URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Google OAuth callback
   */
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiQuery({ name: 'code', required: true, type: String })
  @ApiQuery({ name: 'state', required: true, type: String })
  @ApiResponse({ status: 302, description: 'Redirects to the frontend with a JWT token.' })
  @ApiResponse({ status: 500, description: 'Google OAuth callback error.' })
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      // Exchange code for Google access token
      const accessToken = await this.authService.exchangeGoogleCodeForToken(code);

      // Get Google user info
      const googleUser = await this.authService.getGoogleUser(accessToken);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const stateObject = JSON.parse(state);

      const returnPath = stateObject.path || '/';
      const mode = stateObject.mode || 'auth';
      const reportId = stateObject.reportId || '';

      console.log("🚀 ~ AuthController ~ handleGoogleCallback ~ mode:", mode)

      let user;
      let linkedAccount = false;

      // Check if this is a linking request
      if (mode === 'link' && reportId) {
        // reportId is actually userId in link mode
        const userId = reportId;

        // Check if this Google account already exists
        const existingGoogleUser = await this.userService.findByGoogleId(googleUser.id);

        if (existingGoogleUser && String(existingGoogleUser._id) !== userId) {
          // Google account exists and belongs to a different user - need to merge
          const primaryUser = await this.userService.findById(userId);

          if (!primaryUser) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
          }

          // Determine which account is older
          const primaryUserId = existingGoogleUser.createdAt < primaryUser.createdAt
            ? String(existingGoogleUser._id)
            : userId;
          const secondaryUserId = existingGoogleUser.createdAt < primaryUser.createdAt
            ? userId
            : String(existingGoogleUser._id);

          // Merge accounts
          user = await this.userService.mergeAccounts(primaryUserId, secondaryUserId);
          linkedAccount = true;
        } else if (existingGoogleUser && String(existingGoogleUser._id) === userId) {
          // Already linked to this user
          user = existingGoogleUser;
          linkedAccount = true;
        } else {
          // Link the Google account to the current user
          user = await this.userService.linkGoogleAccount(userId, googleUser);
          linkedAccount = true;
        }
      } else {
        // Normal auth flow - find or create user
        user = await this.userService.findOrCreateGoogleUser(googleUser);
      }

      // Generate JWT token
      const jwtToken = this.userService.generateToken(user);

      try {
        if (reportId && reportId !== '' && mode !== 'link') {
          console.log("====================================================")
          console.log("ASSOCIATING REPORT WITH USER");
          console.log("====================================================")
          const report = await this.staticAnalysisService.associateReportWithUser(reportId, String(user._id));
          console.log("🚀 ~ AuthController ~ handleGoogleCallback ~ report:", report)
        }
      } catch (error) {
        console.error('Failed to associate report with user:', error);
      }

      // Redirect with JWT token
      const redirectUrl = `${frontendUrl}${returnPath}?token=${encodeURIComponent(accessToken)}&user=${encodeURIComponent(JSON.stringify({
        id: String(user._id),
        googleId: user.googleId,
        googleEmail: user.googleEmail,
        githubId: user.githubId,
        githubUsername: user.githubUsername,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        jwtToken: jwtToken,
        mode: mode,
        linkedAccount: linkedAccount,
        reportId: reportId,
        from: returnPath,
      }))}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`;
      res.redirect(errorUrl);
    }
  }

  /**
   * Link GitHub account to existing user (for users who logged in with Google)
   */
  @Get('github/link')
  @ApiOperation({ summary: 'Get GitHub OAuth URL for linking account' })
  @ApiQuery({ name: 'userId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Returns the GitHub OAuth URL for linking.' })
  @ApiResponse({ status: 500, description: 'Failed to generate GitHub link URL.' })
  getGitHubLinkUrl(@Query('userId') userId: string) {
    try {
      const authUrl = this.authService.getGitHubAuthUrl('/dashboard', 'link', userId);
      return { authUrl };
    } catch (error) {
      throw new HttpException(
        'Failed to generate GitHub link URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Link Google account to existing user (for users who logged in with GitHub)
   */
  @Get('google/link')
  @ApiOperation({ summary: 'Get Google OAuth URL for linking account' })
  @ApiQuery({ name: 'userId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Returns the Google OAuth URL for linking.' })
  @ApiResponse({ status: 500, description: 'Failed to generate Google link URL.' })
  getGoogleLinkUrl(@Query('userId') userId: string) {
    try {
      const authUrl = this.authService.getGoogleAuthUrl('/dashboard', 'link', userId);
      return { authUrl };
    } catch (error) {
      throw new HttpException(
        'Failed to generate Google link URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
