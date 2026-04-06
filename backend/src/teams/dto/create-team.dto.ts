import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  gameType?: string; // PUBG_SQUAD, VALORANT_5V5, etc.

  @IsOptional()
  maxMembers?: number;
}
