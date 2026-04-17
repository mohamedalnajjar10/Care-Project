import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get my notifications' })
    getMyNotifications(
        @Req() req: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        const userId = req.user.id || req.user.sub;
        return this.notificationsService.getUserNotifications(userId, page, limit);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notifications count' })
    getUnreadCount(@Req() req: any) {
        const userId = req.user.id || req.user.sub;
        return this.notificationsService.getUnreadCount(userId);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    markAsRead(@Req() req: any, @Param('id') id: string) {
        const userId = req.user.id || req.user.sub;
        return this.notificationsService.markAsRead(userId, id);
    }

    @Patch('mark-all-read')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    markAllAsRead(@Req() req: any) {
        const userId = req.user.id || req.user.sub;
        return this.notificationsService.markAllAsRead(userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete notification' })
    deleteNotification(@Req() req: any, @Param('id') id: string) {
        const userId = req.user.id || req.user.sub;
        return this.notificationsService.deleteNotification(userId, id);
    }
}
