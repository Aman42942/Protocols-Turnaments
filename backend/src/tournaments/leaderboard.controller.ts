import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
// Optional: import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(@Query('limit') limit: string) {
    const limitNum = limit ? parseInt(limit) : 100;
    return this.leaderboardService.getGlobalLeaderboard(limitNum);
  }

  @Get(':tournamentId')
  async getTournamentLeaderboard(@Param('tournamentId') tournamentId: string) {
    return this.leaderboardService.getTournamentLeaderboard(tournamentId);
  }
}
