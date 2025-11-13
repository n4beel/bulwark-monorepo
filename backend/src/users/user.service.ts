import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { GitHubUser, GoogleUser } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WhitelistService } from '../whitelist/whitelist.service';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
        private configService: ConfigService,
        @Inject(forwardRef(() => WhitelistService))
        private whitelistService?: WhitelistService,
    ) {}

    /**
     * Helper method to add email to emails array if not already present
     */
    private addEmailToArray(user: UserDocument, email: string): void {
        if (!email) return;
        
        const normalizedEmail = email.toLowerCase().trim();
        if (!user.emails) {
            user.emails = [];
        }
        
        // Add email if not already in array
        if (!user.emails.includes(normalizedEmail)) {
            user.emails.push(normalizedEmail);
        }
    }

    /**
     * Find or create user from GitHub data
     */
    async findOrCreateUser(githubUser: GitHubUser): Promise<UserDocument> {
        try {
            // Try to find existing user
            let user = await this.userModel.findOne({ githubId: githubUser.id }).exec();

            if (!user) {
                // Create new user
                const emails: string[] = [];
                if (githubUser.email) {
                    emails.push(githubUser.email.toLowerCase().trim());
                }
                
                user = new this.userModel({
                    githubId: githubUser.id,
                    githubUsername: githubUser.login,
                    email: githubUser.email || undefined,
                    emails: emails,
                    name: githubUser.name || undefined,
                    avatarUrl: githubUser.avatar_url || undefined,
                });
                await user.save();
                this.logger.log(`Created new user: ${githubUser.login} (${githubUser.id})`);
            } else {
                // Update existing user info (in case GitHub data changed)
                user.githubUsername = githubUser.login;
                if (githubUser.email) {
                    if (!user.email) user.email = githubUser.email;
                    this.addEmailToArray(user, githubUser.email);
                }
                if (githubUser.name) user.name = githubUser.name;
                if (githubUser.avatar_url) user.avatarUrl = githubUser.avatar_url;
                await user.save();
                this.logger.log(`Updated user: ${githubUser.login} (${githubUser.id})`);
            }

            return user;
        } catch (error) {
            this.logger.error(`Failed to find or create user: ${error.message}`);
            throw error;
        }
    }

    /**
     * Find or create user from Google data
     */
    async findOrCreateGoogleUser(googleUser: GoogleUser): Promise<UserDocument> {
        try {
            // Try to find existing user
            let user = await this.userModel.findOne({ googleId: googleUser.id }).exec();

            if (!user) {
                // Create new user
                const emails: string[] = [];
                if (googleUser.email) {
                    emails.push(googleUser.email.toLowerCase().trim());
                }
                
                user = new this.userModel({
                    googleId: googleUser.id,
                    googleEmail: googleUser.email,
                    email: googleUser.email,
                    emails: emails,
                    name: googleUser.name || undefined,
                    avatarUrl: googleUser.picture || undefined,
                });
                await user.save();
                this.logger.log(`Created new user with Google: ${googleUser.email} (${googleUser.id})`);
            } else {
                // Update existing user info (in case Google data changed)
                if (googleUser.email) {
                    user.googleEmail = googleUser.email;
                    if (!user.email) user.email = googleUser.email;
                    this.addEmailToArray(user, googleUser.email);
                }
                if (googleUser.name && !user.name) user.name = googleUser.name;
                if (googleUser.picture && !user.avatarUrl) user.avatarUrl = googleUser.picture;
                await user.save();
                this.logger.log(`Updated user: ${googleUser.email} (${googleUser.id})`);
            }

            return user;
        } catch (error) {
            this.logger.error(`Failed to find or create Google user: ${error.message}`);
            throw error;
        }
    }

    /**
     * Link GitHub account to existing user
     */
    async linkGitHubAccount(userId: string, githubUser: GitHubUser): Promise<UserDocument> {
        try {
            // Check if GitHub account is already linked to another user
            const existingGithubUser = await this.userModel.findOne({ githubId: githubUser.id }).exec();
            
            if (existingGithubUser && String(existingGithubUser._id) !== userId) {
                throw new BadRequestException('This GitHub account is already associated with another account');
            }

            // Find the current user
            const user = await this.userModel.findById(userId).exec();
            if (!user) {
                throw new BadRequestException('User not found');
            }

            // Link GitHub account
            user.githubId = githubUser.id;
            user.githubUsername = githubUser.login;
            
            // Update common fields only if they don't exist
            if (!user.email && githubUser.email) user.email = githubUser.email;
            if (githubUser.email) this.addEmailToArray(user, githubUser.email);
            if (!user.name && githubUser.name) user.name = githubUser.name;
            if (!user.avatarUrl && githubUser.avatar_url) user.avatarUrl = githubUser.avatar_url;

            await user.save();
            this.logger.log(`Linked GitHub account ${githubUser.login} to user ${userId}`);

            return user;
        } catch (error) {
            this.logger.error(`Failed to link GitHub account: ${error.message}`);
            throw error;
        }
    }

    /**
     * Link Google account to existing user
     */
    async linkGoogleAccount(userId: string, googleUser: GoogleUser): Promise<UserDocument> {
        try {
            // Check if Google account is already linked to another user
            const existingGoogleUser = await this.userModel.findOne({ googleId: googleUser.id }).exec();
            
            if (existingGoogleUser && String(existingGoogleUser._id) !== userId) {
                throw new BadRequestException('This Google account is already associated with another account');
            }

            // Find the current user
            const user = await this.userModel.findById(userId).exec();
            if (!user) {
                throw new BadRequestException('User not found');
            }

            // Link Google account
            user.googleId = googleUser.id;
            user.googleEmail = googleUser.email;
            
            // Update common fields only if they don't exist
            if (!user.email && googleUser.email) user.email = googleUser.email;
            if (googleUser.email) this.addEmailToArray(user, googleUser.email);
            if (!user.name && googleUser.name) user.name = googleUser.name;
            if (!user.avatarUrl && googleUser.picture) user.avatarUrl = googleUser.picture;

            await user.save();
            this.logger.log(`Linked Google account ${googleUser.email} to user ${userId}`);

            return user;
        } catch (error) {
            this.logger.error(`Failed to link Google account: ${error.message}`);
            throw error;
        }
    }

    /**
     * Merge two user accounts - keeps the older account and merges data
     */
    async mergeAccounts(primaryUserId: string, secondaryUserId: string): Promise<UserDocument> {
        try {
            const primaryUser = await this.userModel.findById(primaryUserId).exec();
            const secondaryUser = await this.userModel.findById(secondaryUserId).exec();

            if (!primaryUser || !secondaryUser) {
                throw new BadRequestException('One or both users not found');
            }

            // Store data from secondary user before deleting
            const secondaryData = {
                githubId: secondaryUser.githubId,
                githubUsername: secondaryUser.githubUsername,
                googleId: secondaryUser.googleId,
                googleEmail: secondaryUser.googleEmail,
                email: secondaryUser.email,
                emails: secondaryUser.emails || [],
                name: secondaryUser.name,
                avatarUrl: secondaryUser.avatarUrl,
            };

            // Delete the secondary user FIRST to avoid unique index conflicts
            await this.userModel.findByIdAndDelete(secondaryUserId).exec();
            this.logger.log(`Deleted secondary user ${secondaryUserId}`);

            // Now merge data into primary user (no conflicts possible)
            if (!primaryUser.githubId && secondaryData.githubId) {
                primaryUser.githubId = secondaryData.githubId;
                primaryUser.githubUsername = secondaryData.githubUsername;
            }

            if (!primaryUser.googleId && secondaryData.googleId) {
                primaryUser.googleId = secondaryData.googleId;
                primaryUser.googleEmail = secondaryData.googleEmail;
            }

            if (!primaryUser.email && secondaryData.email) primaryUser.email = secondaryData.email;
            // Merge emails array
            if (secondaryData.emails && secondaryData.emails.length > 0) {
                if (!primaryUser.emails) primaryUser.emails = [];
                secondaryData.emails.forEach(email => {
                    this.addEmailToArray(primaryUser, email);
                });
            }
            if (!primaryUser.name && secondaryData.name) primaryUser.name = secondaryData.name;
            if (!primaryUser.avatarUrl && secondaryData.avatarUrl) primaryUser.avatarUrl = secondaryData.avatarUrl;

            // TODO: When subscriptions are added, merge subscription data here
            // if (secondaryData.subscription && !primaryUser.subscription) {
            //     primaryUser.subscription = secondaryData.subscription;
            // }

            await primaryUser.save();

            this.logger.log(`Merged user ${secondaryUserId} into ${primaryUserId}`);
            return primaryUser;
        } catch (error) {
            this.logger.error(`Failed to merge accounts: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate JWT token for user
     * Includes whitelist status in the token payload
     */
    async generateToken(user: UserDocument): Promise<string> {
        // Check if any of user's emails are whitelisted
        let whitelisted = false;
        if (this.whitelistService) {
            try {
                // Check all emails in the array
                const emailsToCheck = user.emails && user.emails.length > 0 
                    ? user.emails 
                    : (user.email ? [user.email] : []);
                
                for (const email of emailsToCheck) {
                    if (await this.whitelistService.isEmailWhitelisted(email)) {
                        whitelisted = true;
                        break;
                    }
                }
            } catch (error) {
                this.logger.warn(`Failed to check whitelist status for user ${user._id}: ${error.message}`);
                // Default to false if check fails
            }
        }

        const payload = {
            userId: String(user._id),
            githubId: user.githubId,
            githubUsername: user.githubUsername,
            googleId: user.googleId,
            googleEmail: user.googleEmail,
            admin: user.admin || false,
            whitelisted: whitelisted,
        };

        return this.jwtService.sign(payload);
    }

    /**
     * Verify and decode JWT token
     */
    verifyToken(token: string): any {
        return this.jwtService.verify(token);
    }

    /**
     * Find user by ID
     */
    async findById(userId: string): Promise<UserDocument | null> {
        return this.userModel.findById(userId).exec();
    }

    /**
     * Find user by GitHub ID
     */
    async findByGitHubId(githubId: number): Promise<UserDocument | null> {
        return this.userModel.findOne({ githubId }).exec();
    }

    /**
     * Find user by Google ID
     */
    async findByGoogleId(googleId: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ googleId }).exec();
    }
}

