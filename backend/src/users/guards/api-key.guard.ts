import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * API Key Guard - validates X-API-Key header for CLI tool authentication
 * This guard allows CLI tools to authenticate using an API key instead of JWT tokens
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKeyFromHeader(request);

    if (!apiKey) {
      throw new UnauthorizedException(
        'API key is required. Please provide X-API-Key header.',
      );
    }

    const validApiKey = this.configService.get<string>('CLI_API_KEY');

    if (!validApiKey) {
      throw new UnauthorizedException(
        'API key validation is not configured on the server.',
      );
    }

    // Use constant-time comparison to prevent timing attacks
    if (!this.secureCompare(apiKey, validApiKey)) {
      throw new UnauthorizedException('Invalid API key.');
    }

    // Attach CLI identifier to request for logging/auditing
    request.cliAuthenticated = true;
    return true;
  }

  private extractApiKeyFromHeader(request: any): string | undefined {
    return request.headers['x-api-key'] || request.headers['X-API-Key'];
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}






