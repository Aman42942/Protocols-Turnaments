import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async verifyPlayer(game: string, playerId: string) {
    const riotKey = this.configService.get<string>('RIOT_API_KEY');
    const pubgKey = this.configService.get<string>('PUBG_API_KEY');
    const rapidKey = this.configService.get<string>('RAPID_API_KEY');

    this.logger.log(`Verifying ${game} player: ${playerId}`);

    try {
      switch (game.toUpperCase()) {
        case 'VALORANT':
          return this.verifyValorant(playerId, riotKey || '');
        case 'PUBG':
          return this.verifyPubg(playerId, pubgKey || '');
        case 'BGMI':
        case 'FREEFIRE':
          return this.verifyRapidApi(game, playerId, rapidKey || '');
        default:
          throw new BadRequestException('Unsupported game');
      }
    } catch (error) {
      this.logger.error(
        `Verification failed for ${game}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to verify ${game} ID: ${error.message}`,
      );
    }
  }

  private async verifyValorant(riotId: string, apiKey: string) {
    if (!riotId.includes('#')) {
      throw new BadRequestException(
        'Invalid Valorant ID. Format must be Name#Tag',
      );
    }
    const [name, tag] = riotId.split('#');

    // Riot Account API v1
    const url = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;

    // Note: Development keys have rate limits and might not access all regions.
    // Using simple existence check for now.
    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: { 'X-Riot-Token': apiKey },
      }),
    );

    return {
      valid: true,
      game: 'VALORANT',
      playerId: riotId,
      ign: response.data.gameName + '#' + response.data.tagLine,
      rank: 'Verified', // Would need Match API for actual rank
      verifiedAt: new Date(),
    };
  }

  private async verifyPubg(playerName: string, apiKey: string) {
    const url = `https://api.pubg.com/shards/steam/players?filter[playerNames]=${playerName}`;

    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/vnd.api+json',
        },
      }),
    );

    const data = response.data.data[0];
    return {
      valid: true,
      game: 'PUBG',
      playerId: data.id,
      ign: data.attributes.name,
      rank: 'Verified',
      verifiedAt: new Date(),
    };
  }

  private async verifyRapidApi(game: string, playerId: string, apiKey: string) {
    // Using the user-provided endpoint for Free Fire / BGMI check
    // "https://id-game-checker.p.rapidapi.com/dfm-garena/{id}"

    // Determine endpoints based on game if needed, but the user gave a specific curl for Garena (Free Fire).
    // Assuming BGMI might use a different path or logic, but standardizing for now.

    let url = '';
    if (game.toUpperCase() === 'FREEFIRE') {
      url = `https://id-game-checker.p.rapidapi.com/dfm-garena/${playerId}`;
    } else {
      // Fallback for BGMI or generic check if widely supported by this API
      url = `https://id-game-checker.p.rapidapi.com/dfm-bgmi/${playerId}`;
    }

    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'x-rapidapi-host': 'id-game-checker.p.rapidapi.com',
          'x-rapidapi-key': apiKey,
        },
      }),
    );

    // The API response structure needs to be handled dynamically.
    // Assuming success based on non-error response and presence of name.
    if (!response.data || (!response.data.name && !response.data.valid)) {
      throw new BadRequestException('Player not found');
    }

    return {
      valid: true,
      game: game.toUpperCase(),
      playerId: playerId,
      ign: response.data.name || response.data.nickname || 'Unknown',
      rank: response.data.rank || 'N/A', // If provided
      verifiedAt: new Date(),
    };
  }
}
