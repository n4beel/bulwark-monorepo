import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class AdminGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user: UserDocument = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        if (!user.admin) {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}

