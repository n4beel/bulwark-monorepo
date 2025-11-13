import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAuthCallbackService } from './oauth-callback.service';
import { GitHubOAuthProvider } from './providers/github-oauth.provider';
import { GoogleOAuthProvider } from './providers/google-oauth.provider';
import { UserModule } from '../users/user.module';
import { StaticAnalysisModule } from '../static-analysis/static-analysis.module';

@Module({
  imports: [UserModule, StaticAnalysisModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    OAuthCallbackService,
    GitHubOAuthProvider,
    GoogleOAuthProvider,
  ],
  exports: [AuthService],
})
export class AuthModule { }
