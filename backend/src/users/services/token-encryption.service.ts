import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Service for encrypting/decrypting OAuth tokens
 * Uses AES-256-GCM encryption for secure token storage
 */
@Injectable()
export class TokenEncryptionService {
    private readonly logger = new Logger(TokenEncryptionService.name);
    private readonly algorithm = 'aes-256-gcm';
    private readonly encryptionKey: Buffer;

    constructor(private configService: ConfigService) {
        // Get encryption key from environment or generate a default (NOT for production!)
        const keyString = this.configService.get<string>('TOKEN_ENCRYPTION_KEY') || 
                         'default-key-change-in-production-32-chars!!';
        
        // Ensure key is exactly 32 bytes for AES-256
        this.encryptionKey = crypto.scryptSync(keyString, 'salt', 32);
    }

    /**
     * Encrypt a token
     */
    encrypt(token: string): string {
        if (!token) {
            return '';
        }

        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
            
            let encrypted = cipher.update(token, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            // Combine IV, authTag, and encrypted data
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        } catch (error) {
            this.logger.error(`Failed to encrypt token: ${error.message}`);
            throw new Error('Failed to encrypt token');
        }
    }

    /**
     * Decrypt a token
     */
    decrypt(encryptedToken: string): string {
        if (!encryptedToken) {
            return '';
        }

        try {
            const parts = encryptedToken.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted token format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];

            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            this.logger.error(`Failed to decrypt token: ${error.message}`);
            throw new Error('Failed to decrypt token');
        }
    }
}

