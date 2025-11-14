import { Injectable } from '@nestjs/common';
import { AuthService, GoogleUser } from '../auth.service';
import { UserService } from '../../users/user.service';
import { UserDocument } from '../../users/schemas/user.schema';
import { OAuthProviderStrategy, TokenExchangeResult } from '../oauth-callback.service';

@Injectable()
export class GoogleOAuthProvider implements OAuthProviderStrategy {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async exchangeCodeForToken(code: string): Promise<string | TokenExchangeResult> {
    return this.authService.exchangeGoogleCodeForToken(code);
  }

  async getUserInfo(accessToken: string): Promise<GoogleUser> {
    return this.authService.getGoogleUser(accessToken);
  }

  async findExistingUser(userId: string | number): Promise<UserDocument | null> {
    return this.userService.findByGoogleId(userId as string);
  }

  async findOrCreateUser(userInfo: GoogleUser): Promise<UserDocument> {
    return this.userService.findOrCreateGoogleUser(userInfo);
  }

  async linkAccount(userId: string, userInfo: GoogleUser): Promise<UserDocument> {
    return this.userService.linkGoogleAccount(userId, userInfo);
  }

  getUserDisplayName(user: UserDocument): string {
    return user.googleEmail || user.email || user.name || 'Google User';
  }
}

