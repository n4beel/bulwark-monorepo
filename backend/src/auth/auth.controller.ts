import {
  Controller,
  Get,
  Query,
  Res,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { StaticAnalysisService } from 'src/static-analysis/static-analysis.service';
import { OAuthCallbackService } from './oauth-callback.service';
import { GitHubOAuthProvider } from './providers/github-oauth.provider';
import { GoogleOAuthProvider } from './providers/google-oauth.provider';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/users/guards/jwt-auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { UserDocument } from 'src/users/schemas/user.schema';
import { OptionalJwtAuthGuard } from 'src/users/guards/optional-jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private staticAnalysisService: StaticAnalysisService,
    private oauthCallbackService: OAuthCallbackService,
    private githubOAuthProvider: GitHubOAuthProvider,
    private googleOAuthProvider: GoogleOAuthProvider,
  ) { }

  /**
   * Get GitHub OAuth URL
   * If user is authenticated (JWT provided), the account will be linked automatically
   */
  @Get('github/url')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get GitHub OAuth URL' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'mode', required: false, type: String, enum: ['auth', 'connect'] })
  @ApiQuery({ name: 'reportId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns the GitHub OAuth URL.' })
  @ApiResponse({ status: 500, description: 'Failed to generate GitHub auth URL.' })
  getGitHubAuthUrl(
    @Query('from') from: string,
    @Query('mode') mode: string,
    @Query('reportId') reportId: string,
    @CurrentUser() user: UserDocument,
  ) {
    try {
      // If user is authenticated, include their ID for account linking
      const userId = user ? String(user._id) : undefined;
      const authUrl = this.authService.getGitHubAuthUrl(from, mode, reportId, userId);
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
    @Query('state') state: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const { redirectUrl } = await this.oauthCallbackService.processOAuthCallback(
        code,
        state,
        this.githubOAuthProvider,
      );
      res.redirect(redirectUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'GitHub OAuth callback error';

      // Try to extract origin from state if available, otherwise use request origin
      let origin: string | undefined;
      try {
        const stateObject = JSON.parse(state);
        origin = stateObject.origin;
      } catch {
        // If state parsing fails, try to get origin from request
        origin = req.headers.origin ||
          (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
      }

      const errorUrl = this.oauthCallbackService.buildErrorUrl(errorMessage, origin);
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
   * If user is authenticated (JWT provided), the account will be linked automatically
   */
  @Get('google/url')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google OAuth URL' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'mode', required: false, type: String, enum: ['auth', 'connect'] })
  @ApiQuery({ name: 'reportId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns the Google OAuth URL.' })
  @ApiResponse({ status: 500, description: 'Failed to generate Google auth URL.' })
  getGoogleAuthUrl(
    @Query('from') from: string,
    @Query('mode') mode: string,
    @Query('reportId') reportId: string,
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
  ) {
    try {
      // Get origin URL from request
      const origin = req.headers.origin ||
        (req.headers.referer ? new URL(req.headers.referer).origin : null) ||
        `${req.protocol}://${req.get('host')}`;

      console.log("🚀 ~ AuthController ~ getGoogleAuthUrl ~ origin:", origin)

      // If user is authenticated, include their ID for account linking
      const userId = user ? String(user._id) : undefined;
      const authUrl = this.authService.getGoogleAuthUrl(from, mode, reportId, origin, userId);
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
    @Req() req: Request,
  ) {
    try {
      const { redirectUrl } = await this.oauthCallbackService.processOAuthCallback(
        code,
        state,
        this.googleOAuthProvider,
      );
      res.redirect(redirectUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google OAuth callback error';

      // Try to extract origin from state if available, otherwise use request origin
      let origin: string | undefined;
      try {
        const stateObject = JSON.parse(state);
        origin = stateObject.origin;
      } catch {
        // If state parsing fails, try to get origin from request
        origin = req.headers.origin ||
          (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
      }

      const errorUrl = this.oauthCallbackService.buildErrorUrl(errorMessage, origin);
      res.redirect(errorUrl);
    }
  }



  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Returns the current user.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 500, description: 'Failed to get current user.' })
  async getCurrentUser(@CurrentUser() user: UserDocument): Promise<UserDocument> {
    try {
      const reportCount = await this.staticAnalysisService.getUserReportCount(String(user._id));
      return { ...user.toObject(), reportCount };
    } catch (error) {
      throw new HttpException('Failed to get current user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
