import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { GitHubService } from '../github/github.service';
import { WhitelistModule } from '../whitelist/whitelist.module';
import { UserModule } from '../users/user.module';

@Module({
    imports: [WhitelistModule, UserModule],
    controllers: [UploadsController],
    providers: [UploadsService, GitHubService],
    exports: [UploadsService],
})
export class UploadsModule { }
