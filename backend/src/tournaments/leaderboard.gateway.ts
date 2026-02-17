import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'leaderboard',
})
export class LeaderboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('LeaderboardGateway');

  constructor(private leaderboardService: LeaderboardService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Optionally send immediate initial data
    // this.leaderboardService.getGlobalLeaderboard().then(data => client.emit('initial_data', data));
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  async updateLeaderboard(tournamentId: string) {
    this.logger.log(`Broadcasting update for tournament: ${tournamentId}`);
    // Broadcast specific tournament update
    this.server.emit(`leaderboard_update_${tournamentId}`, {
      tournamentId,
      timestamp: new Date(),
    });

    // Also broadcast GLOBAL leaderboard update
    this.logger.log('Broadcasting GLOBAL leaderboard update');
    this.server.emit('global_leaderboard_update', { timestamp: new Date() });
  }
}
