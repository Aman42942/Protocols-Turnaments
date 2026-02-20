import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { LeaderboardCacheService } from '../redis/leaderboard-cache.service';

/**
 * LeaderboardGateway — Per-Tournament WebSocket Rooms
 *
 * Clients JOIN a specific tournament room and only receive updates for that tournament.
 * This prevents broadcasting all updates to all connected clients (O(n) → O(1) per room).
 *
 * Client usage:
 *   socket.emit('join_tournament', { tournamentId: 'abc' })
 *   socket.on('leaderboard_update', (data) => console.log(data))
 *   socket.emit('leave_tournament', { tournamentId: 'abc' })
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'leaderboard',
})
export class LeaderboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LeaderboardGateway.name);

  constructor(private readonly leaderboardCache: LeaderboardCacheService) { }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client joins a tournament-specific room.
   * Immediately sends the current top-50 leaderboard from Redis cache.
   */
  @SubscribeMessage('join_tournament')
  async handleJoinTournament(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tournamentId: string },
  ) {
    const { tournamentId } = data;
    const room = `tournament:${tournamentId}`;

    await client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);

    // Send current cached leaderboard immediately on join
    const leaderboard = await this.leaderboardCache.getTop(tournamentId, 50);
    client.emit('leaderboard_snapshot', { tournamentId, leaderboard, timestamp: new Date() });
  }

  /**
   * Client leaves a tournament room (e.g. navigates away).
   */
  @SubscribeMessage('leave_tournament')
  async handleLeaveTournament(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tournamentId: string },
  ) {
    const room = `tournament:${data.tournamentId}`;
    await client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
  }

  /**
   * Called by MatchService after scores are updated.
   * Fetches fresh leaderboard from Redis cache and broadcasts ONLY to clients
   * in that tournament's room.
   */
  async broadcastLeaderboardUpdate(tournamentId: string): Promise<void> {
    const room = `tournament:${tournamentId}`;
    const leaderboard = await this.leaderboardCache.getTop(tournamentId, 50);

    this.server.to(room).emit('leaderboard_update', {
      tournamentId,
      leaderboard,
      timestamp: new Date(),
    });

    this.logger.log(`Leaderboard update broadcast to room ${room} (${leaderboard.length} entries)`);
  }

  // Keep backward-compatible global broadcast for older clients
  async updateLeaderboard(tournamentId: string) {
    await this.broadcastLeaderboardUpdate(tournamentId);
    // Also emit old-style event for backward compat
    this.server.emit(`leaderboard_update_${tournamentId}`, {
      tournamentId,
      timestamp: new Date(),
    });
  }
}
