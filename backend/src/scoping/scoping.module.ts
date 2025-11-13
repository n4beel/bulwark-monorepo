import { Module } from '@nestjs/common';
import { ScopingService } from './scoping.service';
import { ScopingController } from './scoping.controller';
import { GitHubModule } from '../github/github.module';
import { AIModule } from '../ai/ai.module';
import { WhitelistModule } from '../whitelist/whitelist.module';
import { UserModule } from '../users/user.module';

@Module({
  imports: [GitHubModule, AIModule, WhitelistModule, UserModule],
  controllers: [ScopingController],
  providers: [ScopingService],
  exports: [ScopingService],
})
export class ScopingModule {}
