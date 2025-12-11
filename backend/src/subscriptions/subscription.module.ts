import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionService } from './subscription.service';
import { PaymentService } from './payment.service';
import { SubscriptionController } from './subscription.controller';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import { ScanUsage, ScanUsageSchema } from './schemas/scan-usage.schema';
import { UserModule } from '../users/user.module';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: ScanUsage.name, schema: ScanUsageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => UserModule),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PaymentService],
  exports: [SubscriptionService, PaymentService],
})
export class SubscriptionModule {}

