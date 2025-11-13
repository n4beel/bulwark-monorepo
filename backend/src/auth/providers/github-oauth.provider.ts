import { Injectable } from '@nestjs/common';
import { AuthService, GitHubUser } from '../auth.service';
import { UserService } from '../../users/user.service';
import { UserDocument } from '../../users/schemas/user.schema';
import { OAuthProviderStrategy } from '../oauth-callback.service';

@Injectable()
export class GitHubOAuthProvider implements OAuthProviderStrategy {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) { }

    async exchangeCodeForToken(code: string): Promise<string> {
        return this.authService.exchangeCodeForToken(code);
    }

    async getUserInfo(accessToken: string): Promise<GitHubUser> {
        return this.authService.getGitHubUser(accessToken);
    }

    async findExistingUser(userId: string | number): Promise<UserDocument | null> {
        return this.userService.findByGitHubId(userId as number);
    }

    async findOrCreateUser(userInfo: GitHubUser): Promise<UserDocument> {
        return this.userService.findOrCreateUser(userInfo);
    }

    async linkAccount(userId: string, userInfo: GitHubUser): Promise<UserDocument> {
        return this.userService.linkGitHubAccount(userId, userInfo);
    }

    getUserDisplayName(user: UserDocument): string {
        return user.githubUsername || user.name || 'GitHub User';
    }
}

