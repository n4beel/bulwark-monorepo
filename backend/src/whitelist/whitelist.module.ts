import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Whitelist, WhitelistSchema } from './schemas/whitelist.schema';
import { WhitelistService } from './whitelist.service';
import { WhitelistController } from './whitelist.controller';
import { WhitelistGuard } from './guards/whitelist.guard';
import { AdminGuard } from './guards/admin.guard';
import { UserModule } from '../users/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Whitelist.name, schema: WhitelistSchema }]),
        forwardRef(() => UserModule),
    ],
    providers: [WhitelistService, WhitelistGuard, AdminGuard],
    controllers: [WhitelistController],
    exports: [WhitelistService, WhitelistGuard, AdminGuard],
})
export class WhitelistModule {}

