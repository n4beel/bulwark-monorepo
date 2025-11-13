import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from './schemas/user.schema';
import { UserService } from './user.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { WhitelistModule } from '../whitelist/whitelist.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
                },
            }),
            inject: [ConfigService],
        }),
        forwardRef(() => WhitelistModule),
    ],
    providers: [UserService, JwtAuthGuard, OptionalJwtAuthGuard],
    exports: [UserService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class UserModule {}

