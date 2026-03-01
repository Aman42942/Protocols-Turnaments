import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';

export enum TournamentTier {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum GameMode {
  SOLO = 'SOLO',
  DUO = 'DUO',
  SQUAD = 'SQUAD',
  TEAM_5V5 = 'TEAM_5V5',
}

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  game: string;

  @IsEnum(TournamentTier)
  tier: TournamentTier;

  @IsNumber()
  @Min(0)
  entryFeePerPerson: number;

  @IsNumber()
  @Min(0)
  prizePool: number;

  @IsDateString()
  startDate: string;

  @IsNumber()
  @Min(2)
  maxTeams: number;

  @IsEnum(GameMode)
  gameMode: GameMode;

  @IsString()
  @IsOptional()
  format?: string;

  // Game-Specific Settings (stored as JSON strings)
  @IsString()
  @IsOptional()
  scoringEngine?: string;

  @IsString()
  @IsOptional()
  mapPool?: string;

  @IsString()
  @IsOptional()
  gameSettings?: string;

  @IsString()
  @IsOptional()
  rules?: string;

  @IsString()
  @IsOptional()
  prizeDistribution?: string;

  // Room Management (BGMI/FF)
  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString()
  @IsOptional()
  roomPassword?: string;

  @IsString()
  @IsOptional()
  slotList?: string;

  // Sharing & Links
  @IsString()
  @IsOptional()
  shareCode?: string;

  @IsString()
  @IsOptional()
  whatsappGroupLink?: string;

  @IsString()
  @IsOptional()
  discordChannelId?: string;

  @IsString()
  @IsOptional()
  streamUrl?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  banner?: string;
}
