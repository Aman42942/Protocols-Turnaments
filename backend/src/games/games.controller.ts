import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('verify')
  verifyPlayer(@Query('game') game: string, @Query('id') playerId: string) {
    if (!game || !playerId) {
      throw new BadRequestException('Game and Player ID are required');
    }
    return this.gamesService.verifyPlayer(game, playerId);
  }
}
