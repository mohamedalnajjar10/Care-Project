import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:4200',
        credentials: true,
    },
    namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    private userSockets: Map<string, Set<string>> = new Map();

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization;

            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                client.disconnect();
                return;
            }

            const decoded = this.jwtService.verify(token.replace('Bearer ', ''), {
                secret: this.configService.get('JWT_SECRET'),
            });

            const userId = decoded.sub || decoded.id;
            client.data.userId = userId;

            // Track user connections - FIX: Check if exists before adding
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }

            const userSocketSet = this.userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.add(client.id);
            }

            // Join user-specific room
            client.join(`user:${userId}`);

            this.logger.log(`Client ${client.id} connected for user ${userId}`);
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.userId;
        if (userId) {
            const sockets = this.userSockets.get(userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.userSockets.delete(userId);
                }
            }
        }
        this.logger.log(`Client ${client.id} disconnected`);
    }

    @SubscribeMessage('subscribe')
    handleSubscribe(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        this.logger.log(`User ${userId} subscribed to notifications`);
        return { event: 'subscribed', data: { userId } };
    }

    /**
     * Send notification to specific user
     */
    sendNotificationToUser(userId: string, notification: any) {
        this.server.to(`user:${userId}`).emit('notification', notification);
        this.logger.log(`Notification sent to user ${userId}: ${notification.id}`);
    }

    /**
     * Send notification to multiple users
     */
    sendNotificationToUsers(userIds: string[], notification: any) {
        userIds.forEach((userId) => {
            this.sendNotificationToUser(userId, notification);
        });
    }

    /**
     * Broadcast to all connected users
     */
    broadcastNotification(notification: any) {
        this.server.emit('notification', notification);
        this.logger.log(`Notification broadcasted: ${notification.id}`);
    }
}
