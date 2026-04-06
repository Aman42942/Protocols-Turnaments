import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import * as crypto from 'crypto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, createTeamDto: CreateTeamDto) {
    // Generate unique invite code
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Transaction: Create Team -> Add User as Leader
    return this.prisma.$transaction(async (prisma) => {
      const team = await prisma.team.create({
        data: {
          name: createTeamDto.name,
          logo: createTeamDto.logo,
          leaderId: userId,
          inviteCode: inviteCode,
          gameType: createTeamDto.gameType || 'PUBG_SQUAD',
          maxMembers: createTeamDto.maxMembers || 4,
        },
      });

      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: userId,
          role: 'LEADER',
        },
      });

      // Fetch the created team with members to return a complete object
      return prisma.team.findUnique({
        where: { id: team.id },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
        },
      });
    });
  }

  findAll(userId: string) {
    return this.prisma.team.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findOne(id: string) {
    return this.prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });
  }

  async findByInviteCode(code: string) {
    const team = await this.prisma.team.findUnique({
      where: { inviteCode: code.toUpperCase() },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        _count: { select: { members: true } },
      },
    });

    if (!team)
      throw new NotFoundException('Team not found with this invite code');
    return team;
  }

  async join(userId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { _count: { select: { members: true } } },
    });

    if (!team) throw new NotFoundException('Team not found');

    // Check member limit
    if (team._count.members >= team.maxMembers) {
      throw new BadRequestException('Team is full');
    }

    // Check if user is already in the team
    const existingMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (existingMember) {
      throw new BadRequestException('User already in this team');
    }

    return this.prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role: 'MEMBER',
      },
    });
  }

  async joinByCode(userId: string, code: string) {
    const team = await this.findByInviteCode(code);
    return this.join(userId, team.id);
  }

  async kickMember(actorId: string, teamId: string, targetUserId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) throw new NotFoundException('Team not found');

    const actor = team.members.find(m => m.userId === actorId);
    const target = team.members.find(m => m.userId === targetUserId);

    if (!actor) throw new BadRequestException('You are not a member of this team');
    if (!target) throw new BadRequestException('Target user is not in this team');

    // Logic: ONLY LEADER can kick anybody. COLEADER can kick MEMBERS.
    if (actor.role === 'LEADER') {
      // Leader can kick anyone except themselves (they should disband)
      if (actorId === targetUserId) throw new BadRequestException('Leader cannot kick themselves. Disband the team instead.');
    } else if (actor.role === 'COLEADER') {
      if (target.role !== 'MEMBER') {
        throw new ForbiddenException('Co-Leaders can only kick regular members');
      }
    } else {
      throw new ForbiddenException('Only Leaders and Co-Leaders can kick members');
    }

    return this.prisma.teamMember.delete({
      where: { id: target.id }
    });
  }

  async leaveTeam(userId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) throw new NotFoundException('Team not found');

    const member = team.members.find(m => m.userId === userId);
    if (!member) throw new BadRequestException('You are not a member of this team');

    // Leader cannot leave - must disband or transfer (transfer not implemented)
    if (member.role === 'LEADER') {
      throw new BadRequestException('Team Leader cannot leave their squadron. Disband the unit or transfer leadership instead.');
    }

    return this.prisma.teamMember.delete({
      where: { id: member.id }
    });
  }

  async updateMemberRole(leaderId: string, teamId: string, targetUserId: string, newRole: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) throw new NotFoundException('Team not found');
    if (team.leaderId !== leaderId) throw new ForbiddenException('Only the Team Leader can manage roles');

    const target = team.members.find(m => m.userId === targetUserId);
    if (!target) throw new BadRequestException('Target user is not in this team');

    if (!['MEMBER', 'COLEADER'].includes(newRole)) {
      throw new BadRequestException('Invalid role. Use MEMBER or COLEADER');
    }

    return this.prisma.teamMember.update({
      where: { id: target.id },
      data: { role: newRole }
    });
  }

  update(id: string, updateTeamDto: UpdateTeamDto) {
    return this.prisma.team.update({
      where: { id },
      data: updateTeamDto,
    });
  }

  remove(id: string) {
    return this.prisma.team.delete({
      where: { id },
    });
  }

  // ─── ADMIN: Get all teams registered in a tournament ────────────────────────
  async getTeamsByTournament(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, title: true, game: true, gameMode: true, maxTeams: true, entryFeePerPerson: true },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');

    // Get all TournamentParticipant records with their team and user info
    const participants = await this.prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        team: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, avatar: true } } },
            },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    return { tournament, participants };
  }

  // ─── ADMIN: Disqualify / forcibly remove a team from a tournament ────────────
  async disqualifyTeam(tournamentId: string, teamId: string, reason: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, leaderId: true },
    });
    if (!team) throw new NotFoundException('Team not found');

    // Get all member userIds
    const members = await this.prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });
    const memberIds = members.map(m => m.userId);

    // Cancel tournament registrations for all team members
    const updated = await this.prisma.tournamentParticipant.updateMany({
      where: {
        tournamentId,
        userId: { in: memberIds },
        status: { not: 'CANCELLED' },
      },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'CANCELLED',
      },
    });

    return {
      success: true,
      message: `Team "${team.name}" has been disqualified. ${updated.count} member(s) removed from tournament.`,
      teamName: team.name,
      removedCount: updated.count,
    };
  }

  // ─── TEAM INVITATIONS ───────────────────────────────────────────────────
  async sendInvitation(inviterId: string, teamId: string, targetUserId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true, _count: { select: { members: true } } },
    });

    if (!team) throw new NotFoundException('Team not found');
    const member = team.members.find((m) => m.userId === inviterId);
    if (!member || (member.role !== 'LEADER' && member.role !== 'COLEADER')) {
      throw new ForbiddenException(
        'Only Leaders and Co-Leaders can invite members',
      );
    }

    if (team._count.members >= team.maxMembers) {
      throw new BadRequestException('Team is full');
    }

    // Check if already a member
    const alreadyMember = team.members.some((m) => m.userId === targetUserId);
    if (alreadyMember)
      throw new BadRequestException('User is already a member of this team');

    // Create invitation (upsert status if already exists)
    const invitation = await this.prisma.teamInvitation.upsert({
      where: { teamId_userId: { teamId, userId: targetUserId } },
      create: { teamId, userId: targetUserId, inviterId, status: 'PENDING' },
      update: { inviterId, status: 'PENDING', createdAt: new Date() },
    });

    // Send notification
    await this.prisma.notification.create({
      data: {
        userId: targetUserId,
        title: 'Team Invitation',
        message: `You have been invited to join squad "${team.name}"`,
        type: 'info',
        link: `/dashboard/teams/invites`,
      },
    });

    return invitation;
  }

  async getMyInvitations(userId: string) {
    return this.prisma.teamInvitation.findMany({
      where: { userId, status: 'PENDING' },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            logo: true,
            gameType: true,
            inviteCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeamInvitations(teamId: string) {
    return this.prisma.teamInvitation.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToInvitation(
    userId: string,
    invitationId: string,
    action: 'ACCEPT' | 'DECLINE',
  ) {
    const invitation = await this.prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: { team: { include: { _count: { select: { members: true } } } } },
    });

    if (!invitation || invitation.userId !== userId) {
      throw new NotFoundException('Invitation not found');
    }

    if (action === 'DECLINE') {
      return this.prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'DECLINED' },
      });
    }

    // Action is ACCEPT
    // Check if team is full
    if (invitation.team._count.members >= invitation.team.maxMembers) {
      throw new BadRequestException('Team is full');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Add member
      await prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: userId,
          role: 'MEMBER',
        },
      });

      // Update invitation status
      return prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' },
      });
    });
  }

  async cancelInvitation(actorId: string, teamId: string, invitationId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) throw new NotFoundException('Team not found');
    const actor = team.members.find((m) => m.userId === actorId);
    if (!actor || (actor.role !== 'LEADER' && actor.role !== 'COLEADER')) {
      throw new ForbiddenException(
        'Only Leaders and Co-Leaders can cancel invitations',
      );
    }

    return this.prisma.teamInvitation.delete({
      where: { id: invitationId },
    });
  }
}
