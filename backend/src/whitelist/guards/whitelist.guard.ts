import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { WhitelistService } from '../whitelist.service';
import { UserDocument } from '../../users/schemas/user.schema';
import { UserService } from '../../users/user.service';

/**
 * Whitelist Guard - Checks if authenticated user is whitelisted
 * Checks JWT payload first (more efficient), falls back to database check
 * Only checks whitelist if user is authenticated (has JWT token)
 * Allows unauthenticated requests to pass through (for public routes)
 */
@Injectable()
export class WhitelistGuard implements CanActivate {
    constructor(
        private whitelistService: WhitelistService,
        private userService: UserService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user: UserDocument = request.user;

        // If no user is authenticated, allow the request (for public routes)
        if (!user) {
            return true;
        }

        // Try to get whitelist status from JWT payload first (more efficient)
        const authHeader = request.headers.authorization;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1]; // Extract Bearer token
                if (token) {
                    const payload = this.userService.verifyToken(token);
                    // If JWT has whitelisted field, use it (new tokens)
                    if (payload.whitelisted !== undefined) {
                        // JWT has whitelisted field - trust it (user needs to re-authenticate to update)
                        if (!payload.whitelisted) {
                            throw new ForbiddenException('Your email is not whitelisted. Please contact an administrator.');
                        }
                        return true; // User is whitelisted according to JWT
                    }
                    // JWT doesn't have whitelisted field - fall through to database check
                }
            } catch (error) {
                // If JWT verification fails or doesn't have whitelisted field, fall through to database check
                if (error instanceof ForbiddenException) {
                    throw error; // Re-throw our ForbiddenException
                }
                // Otherwise, continue to database check (for old tokens or invalid tokens)
            }
        }

        // Fallback: Check whitelist in database (for old tokens without whitelisted field)
        // Check all emails in the user's emails array
        const emailsToCheck = user.emails && user.emails.length > 0 
            ? user.emails 
            : (user.email ? [user.email] : []);
        
        // Also check googleEmail if it's different
        if (user.googleEmail && !emailsToCheck.includes(user.googleEmail.toLowerCase().trim())) {
            emailsToCheck.push(user.googleEmail.toLowerCase().trim());
        }
        
        if (emailsToCheck.length === 0) {
            throw new ForbiddenException('User email not found');
        }

        // Check if any email is whitelisted
        let isWhitelisted = false;
        for (const email of emailsToCheck) {
            const normalizedEmail = email.toLowerCase().trim();
            if (await this.whitelistService.isEmailWhitelisted(normalizedEmail)) {
                isWhitelisted = true;
                break;
            }
        }

        if (!isWhitelisted) {
            throw new ForbiddenException('Your email is not whitelisted. Please contact an administrator.');
        }

        return true;
    }
}

