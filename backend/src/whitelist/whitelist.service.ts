import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Whitelist, WhitelistDocument } from './schemas/whitelist.schema';

@Injectable()
export class WhitelistService {
    private readonly logger = new Logger(WhitelistService.name);

    constructor(
        @InjectModel(Whitelist.name) private whitelistModel: Model<WhitelistDocument>,
    ) {}

    /**
     * Check if an email is whitelisted
     */
    async isEmailWhitelisted(email: string): Promise<boolean> {
        if (!email) {
            return false;
        }

        try {
            const normalizedEmail = email.toLowerCase().trim();
            const whitelisted = await this.whitelistModel.findOne({ email: normalizedEmail }).exec();
            return !!whitelisted;
        } catch (error) {
            this.logger.error(`Failed to check whitelist for email ${email}: ${error.message}`);
            return false;
        }
    }

    /**
     * Get all whitelisted emails
     */
    async getAllEmails(): Promise<string[]> {
        try {
            const whitelist = await this.whitelistModel.find().exec();
            return whitelist.map(item => item.email);
        } catch (error) {
            this.logger.error(`Failed to get whitelist: ${error.message}`);
            throw error;
        }
    }

    /**
     * Add emails to whitelist (comma-separated or array)
     */
    async addEmails(emails: string | string[]): Promise<{ added: string[]; skipped: string[] }> {
        try {
            const emailArray = Array.isArray(emails) 
                ? emails 
                : emails.split(',').map(e => e.trim()).filter(e => e.length > 0);

            const added: string[] = [];
            const skipped: string[] = [];

            for (const email of emailArray) {
                const normalizedEmail = email.toLowerCase().trim();
                
                // Basic email validation
                if (!this.isValidEmail(normalizedEmail)) {
                    skipped.push(email);
                    continue;
                }

                try {
                    const existing = await this.whitelistModel.findOne({ email: normalizedEmail }).exec();
                    if (existing) {
                        skipped.push(email);
                        continue;
                    }

                    await this.whitelistModel.create({ email: normalizedEmail });
                    added.push(email);
                } catch (error) {
                    // Handle duplicate key error
                    if (error.code === 11000) {
                        skipped.push(email);
                    } else {
                        this.logger.error(`Failed to add email ${email}: ${error.message}`);
                        skipped.push(email);
                    }
                }
            }

            return { added, skipped };
        } catch (error) {
            this.logger.error(`Failed to add emails: ${error.message}`);
            throw error;
        }
    }

    /**
     * Remove emails from whitelist
     */
    async removeEmails(emails: string | string[]): Promise<{ removed: string[]; notFound: string[] }> {
        try {
            const emailArray = Array.isArray(emails) 
                ? emails 
                : emails.split(',').map(e => e.trim()).filter(e => e.length > 0);

            const removed: string[] = [];
            const notFound: string[] = [];

            for (const email of emailArray) {
                const normalizedEmail = email.toLowerCase().trim();
                
                const result = await this.whitelistModel.deleteOne({ email: normalizedEmail }).exec();
                
                if (result.deletedCount > 0) {
                    removed.push(email);
                } else {
                    notFound.push(email);
                }
            }

            return { removed, notFound };
        } catch (error) {
            this.logger.error(`Failed to remove emails: ${error.message}`);
            throw error;
        }
    }

    /**
     * Basic email validation
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

