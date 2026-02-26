import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post(':id/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async submitResults(
    @Param('id') id: string,
    @Body()
    body: { results: { teamId: string; placement: number; kills: number }[] },
  ) {
    return this.matchService.submitMatchResults(id, body.results);
  }
}
