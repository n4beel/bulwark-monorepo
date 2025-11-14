import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from '../users/user.service';
import { StaticAnalysisService } from '../static-analysis/static-analysis.service';
import { AuthService, GitHubUser, GoogleUser } from './auth.service';
import { UserDocument } from '../users/schemas/user.schema';

export interface OAuthState {
    path?: string;
    reportId?: string;
    userId?: string;
    mode?: 'auth' | 'connect'; // Explicit mode: 'auth' for new login, 'connect' for linking additional provider
    origin?: string;
}

export interface OAuthProviderStrategy {
    exchangeCodeForToken(code: string): Promise<string>;
    getUserInfo(accessToken: string): Promise<GitHubUser | GoogleUser>;
    findExistingUser(userId: string | number): Promise<UserDocument | null>;
    findOrCreateUser(userInfo: GitHubUser | GoogleUser): Promise<UserDocument>;
    linkAccount(userId: string, userInfo: GitHubUser | GoogleUser): Promise<UserDocument>;
    getUserDisplayName(user: UserDocument): string;
}

@Injectable()
export class OAuthCallbackService {
    private readonly logger = new Logger(OAuthCallbackService.name);
    private readonly frontendUrl: string;

    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly staticAnalysisService: StaticAnalysisService,
    ) {
        this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    }

    /**
     * Parse OAuth state from query parameter
     */
    parseState(state: string): OAuthState {
        try {
            const parsed = JSON.parse(state);
            // Ensure mode has a default value (for frontend use only)
            if (!parsed.mode) {
                parsed.mode = 'auth';
            }
            return parsed;
        } catch (error) {
            this.logger.error(`Failed to parse OAuth state: ${error.message}`);
            return { path: '/', reportId: '', mode: 'auth' };
        }
    }

    /**
     * Handle account linking logic
     */
    async handleAccountLinking(
        provider: OAuthProviderStrategy,
        userId: string,
        userInfo: GitHubUser | GoogleUser,
    ): Promise<{ user: UserDocument; linkedAccount: boolean }> {
        const existingUser = await provider.findExistingUser(userInfo.id);

        if (existingUser && String(existingUser._id) !== userId) {
            // Account exists and belongs to a different user - need to merge
            const primaryUser = await this.userService.findById(userId);

            if (!primaryUser) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }

            // Determine which account is older
            const primaryUserId =
                existingUser.createdAt < primaryUser.createdAt
                    ? String(existingUser._id)
                    : userId;
            const secondaryUserId =
                existingUser.createdAt < primaryUser.createdAt
                    ? userId
                    : String(existingUser._id);

            // Merge accounts
            const user = await this.userService.mergeAccounts(primaryUserId, secondaryUserId);
            return { user, linkedAccount: true };
        }

        if (existingUser && String(existingUser._id) === userId) {
            // Already linked to this user
            return { user: existingUser, linkedAccount: true };
        }

        // Link the account to the current user
        const user = await provider.linkAccount(userId, userInfo);
        return { user, linkedAccount: true };
    }

    /**
     * Associate report with user if applicable
     * Only associates if reportId is provided and we're not in linking mode
     */
    async associateReportIfNeeded(
        reportId: string,
        userId: string,
        isLinking: boolean,
    ): Promise<void> {
        if (!reportId || reportId === '' || isLinking) {
            return;
        }

        try {
            this.logger.log(`Associating report ${reportId} with user ${userId}`);
            await this.staticAnalysisService.associateReportWithUser(reportId, userId);
        } catch (error) {
            this.logger.error(`Failed to associate report with user: ${error.message}`, error.stack);
            // Don't throw - report association failure shouldn't break auth flow
        }
    }

    /**
     * Build redirect URL with user data
     */
    buildRedirectUrl(
        returnPath: string,
        accessToken: string,
        user: UserDocument,
        jwtToken: string,
        linkedAccount: boolean,
        reportId: string,
        mode: string,
        origin: string,
    ): string {
        const userData = {
            id: String(user._id),
            githubId: user.githubId,
            githubUsername: user.githubUsername,
            googleId: user.googleId,
            googleEmail: user.googleEmail,
            email: user.email,
            emails: user.emails || (user.email ? [user.email] : []), // Array of all emails
            name: user.name,
            avatarUrl: user.avatarUrl,
            admin: user.admin || false,
            jwtToken: jwtToken,
            linkedAccount: linkedAccount,
            reportId: reportId,
            mode: mode, // Passed through to frontend
            from: returnPath,
        };

        return `${origin || this.frontendUrl}${returnPath}?token=${encodeURIComponent(accessToken)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
    }

    /**
     * Build error redirect URL
     * @param errorMessage - Error message to display
     * @param origin - Optional origin URL from request (falls back to frontendUrl)
     */
    buildErrorUrl(errorMessage: string, origin?: string): string {
        const baseUrl = origin || this.frontendUrl;
        return `${baseUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`;
    }

    /**
     * Process OAuth callback - main orchestration method
     */
    async processOAuthCallback(
        code: string,
        state: string,
        provider: OAuthProviderStrategy,
    ): Promise<{ redirectUrl: string }> {
        try {
            // Exchange code for access token
            const accessToken = await provider.exchangeCodeForToken(code);

            // Get user info from provider
            const userInfo = await provider.getUserInfo(accessToken);

            // Parse state
            const stateObject = this.parseState(state);
            const returnPath = stateObject.path || '/';
            const reportId = stateObject.reportId || '';
            const userId = stateObject.userId || '';
            const mode = stateObject.mode || 'auth'; // Passed through to frontend
            const origin = stateObject.origin || '';

            // Detect if this is a linking request (based on userId presence, not mode)
            const isLinking = !!userId;

            this.logger.log(
                `Processing OAuth callback - mode: ${mode}, returnPath: ${returnPath}, linking: ${isLinking}`,
            );

            let user: UserDocument;
            let linkedAccount = false;

            // Handle account linking or normal auth flow
            if (isLinking) {
                // User was authenticated - link the new provider to their account
                const result = await this.handleAccountLinking(provider, userId, userInfo);
                user = result.user;
                linkedAccount = result.linkedAccount;
            } else {
                // Normal auth flow - find or create user
                user = await provider.findOrCreateUser(userInfo);
            }

            // Generate JWT token (includes whitelist status)
            const jwtToken = await this.userService.generateToken(user);

            // Associate report with user if needed (only if not linking)
            await this.associateReportIfNeeded(reportId, String(user._id), isLinking);

            // Build redirect URL
            const redirectUrl = this.buildRedirectUrl(
                returnPath,
                accessToken,
                user,
                jwtToken,
                linkedAccount,
                reportId,
                mode,
                origin,
            );

            return { redirectUrl };
        } catch (error) {
            this.logger.error(`OAuth callback error: ${error.message}`, error.stack);
            throw error;
        }
    }
}

