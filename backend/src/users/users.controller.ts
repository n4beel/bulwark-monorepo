import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserDocument } from './schemas/user.schema';
import { SubscriptionService } from '../subscriptions/subscription.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Get('scan-status')
  @ApiOperation({
    summary: 'Get user scan status',
    description:
      'Returns the current tier, scans used, scans remaining, and reset date for the authenticated user. This endpoint is used by the dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns scan status',
    schema: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['basic', 'forensic'] },
        scansUsed: { type: 'number' },
        scansRemaining: { type: 'number' },
        scanLimit: { type: 'number' },
        resetDate: { type: 'string', format: 'date-time' },
        subscriptionStatus: { type: 'string' },
      },
    },
  })
  async getScanStatus(@CurrentUser() user: UserDocument) {
    const userId = String(user._id);
    return await this.subscriptionService.getUserScanStatus(userId);
  }
}


