import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: 'admin-ops', cors: { origin: '*' } })
export class OperationsGateway {
    @WebSocketServer() server: Server;

    sendFraudAlert(alert: any) {
        this.server.emit('fraud-alert', alert);
    }

    sendLiveMatchUpdate(match: any) {
        this.server.emit('live-match-update', match);
    }
}
