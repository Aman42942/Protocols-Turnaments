import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import * as crypto from 'crypto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

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

      return team;
    });
  }

  findAll() {
    return this.prisma.team.findMany({
      include: { _count: { select: { members: true } } },
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
}
