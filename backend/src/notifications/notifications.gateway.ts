import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class NotificationsGateway implements OnGatewayInit {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('NotificationsGateway');

    afterInit(server: Server) {
        this.logger.log('Notifications Gateway Initialized');
    }

    broadcastMaintenanceStatus(status: { isMaintenanceMode: boolean }) {
        this.logger.log(`Broadcasting maintenance status: ${status.isMaintenanceMode}`);
        this.server.emit('maintenance-status', status);
    }
}
