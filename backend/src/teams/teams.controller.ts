import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(req.user.userId, createTeamDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.teamsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Get('invite/:code')
  findByInviteCode(@Param('code') code: string) {
    return this.teamsService.findByInviteCode(code);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@Request() req, @Param('id') id: string) {
    return this.teamsService.join(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  leave(@Request() req, @Param('id') id: string) {
    return this.teamsService.leaveTeam(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite/:code/join')
  joinByCode(@Request() req, @Param('code') code: string) {
    return this.teamsService.joinByCode(req.user.userId, code);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/members/:userId')
  kickMember(
    @Request() req,
    @Param('id') teamId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.teamsService.kickMember(req.user.userId, teamId, targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/members/:userId/role')
  updateMemberRole(
    @Request() req,
    @Param('id') teamId: string,
    @Param('userId') targetUserId: string,
    @Body() body: { role: string },
  ) {
    return this.teamsService.updateMemberRole(
      req.user.userId,
      teamId,
      targetUserId,
      body.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }

  // ─── TEAM INVITATIONS ───────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('invitations/me')
  getMyInvitations(@Request() req) {
    return this.teamsService.getMyInvitations(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invitations')
  sendInvitation(
    @Param('id') id: string,
    @Body('userId') targetUserId: string,
    @Request() req,
  ) {
    return this.teamsService.sendInvitation(req.user.userId, id, targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/invitations')
  getTeamInvitations(@Param('id') id: string) {
    return this.teamsService.getTeamInvitations(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('invitations/:invitationId/respond')
  respondToInvitation(
    @Param('invitationId') invitationId: string,
    @Body('action') action: 'ACCEPT' | 'DECLINE',
    @Request() req,
  ) {
    return this.teamsService.respondToInvitation(
      req.user.userId,
      invitationId,
      action,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/invitations/:invitationId')
  cancelInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @Request() req,
  ) {
    return this.teamsService.cancelInvitation(req.user.userId, id, invitationId);
  }

  // ─── ADMIN: View all teams in a tournament ─────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('tournament/:tournamentId')
  getTeamsByTournament(@Param('tournamentId') tournamentId: string) {
    return this.teamsService.getTeamsByTournament(tournamentId);
  }

  // ─── ADMIN: Disqualify a team from a tournament ────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':teamId/disqualify/:tournamentId')
  disqualifyTeam(
    @Param('teamId') teamId: string,
    @Param('tournamentId') tournamentId: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    return this.teamsService.disqualifyTeam(
      tournamentId,
      teamId,
      body.reason || 'Disqualified by admin',
    );
  }
}
