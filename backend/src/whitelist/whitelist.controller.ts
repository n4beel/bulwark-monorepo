import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WhitelistService } from './whitelist.service';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('whitelist')
@Controller('whitelist')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class WhitelistController {
    constructor(private readonly whitelistService: WhitelistService) {}

    /**
     * Get all whitelisted emails
     */
    @Get()
    @ApiOperation({ summary: 'Get all whitelisted emails (Admin only)' })
    @ApiResponse({ status: 200, description: 'Returns list of whitelisted emails.' })
    @ApiResponse({ status: 403, description: 'Admin access required.' })
    async getAllEmails() {
        const emails = await this.whitelistService.getAllEmails();
        return { emails };
    }

    /**
     * Add emails to whitelist
     */
    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Add emails to whitelist (Admin only)' })
    @ApiResponse({ status: 200, description: 'Emails added successfully.' })
    @ApiResponse({ status: 403, description: 'Admin access required.' })
    async addEmails(@Body() body: { emails: string }) {
        const result = await this.whitelistService.addEmails(body.emails);
        return {
            message: 'Emails processed',
            added: result.added,
            skipped: result.skipped,
        };
    }

    /**
     * Remove emails from whitelist
     */
    @Delete()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove emails from whitelist (Admin only)' })
    @ApiResponse({ status: 200, description: 'Emails removed successfully.' })
    @ApiResponse({ status: 403, description: 'Admin access required.' })
    async removeEmails(@Body() body: { emails: string }) {
        const result = await this.whitelistService.removeEmails(body.emails);
        return {
            message: 'Emails processed',
            removed: result.removed,
            notFound: result.notFound,
        };
    }
}

