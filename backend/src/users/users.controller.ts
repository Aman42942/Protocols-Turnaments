import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { ActivityLogService } from '../activity-log/activity-log.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly activityLogService: ActivityLogService,
  ) { }

  @Get('search')
  @UseGuards(AuthGuard('jwt'))
  async search(@Query('q') q: string, @Request() req) {
    return this.usersService.search(q, req.user.userId);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new UnauthorizedException('User not found');
    const { password, ...result } = user;
    return result;
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Request() req, @Body() body: any) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('EMPLOYEE')
  async findAll() {
    return this.usersService.findAll();
  }

  // Admin: Dashboard stats
  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async getAdminStats() {
    return this.usersService.getAdminStats();
  }

  // Super Admin: Update user role
  @Patch('admin/:id/role')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPERADMIN')
  async updateRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @Request() req,
  ) {
    const result = await this.usersService.updateRole(
      req.user.userId,
      id,
      body.role,
    );
    await this.activityLogService.log(
      req.user.userId,
      'UPDATE_USER_ROLE',
      { role: body.role },
      id,
      req.ip,
    );
    return result;
  }

  @Post('admin/:id/toggle-ban')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async toggleBan(@Param('id') id: string, @Request() req) {
    try {
      const result = await this.usersService.toggleBan(req.user.userId, id);
      await this.activityLogService.log(
        req.user.userId,
        'TOGGLE_BAN_USER',
        { banned: result.banned },
        id,
        req.ip,
      );
      return result;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('admin/:id/toggle-privacy')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'ULTIMATE_ADMIN')
  async togglePrivacy(@Param('id') id: string, @Request() req) {
    try {
      const result = await this.usersService.togglePrivacyOverride(req.user.userId, id);
      await this.activityLogService.log(
        req.user.userId,
        // @ts-ignore
        'TOGGLE_PRIVACY_OVERRIDE',
        { canChangeVisibility: result.canChangeVisibility },
        id,
        req.ip,
      );
      return result;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  // Super Admin: Delete user
  @Delete('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPERADMIN')
  async deleteUser(@Param('id') id: string, @Request() req) {
    const result = await this.usersService.deleteUser(id);
    await this.activityLogService.log(
      req.user.userId,
      'DELETE_USER',
      null,
      id,
      req.ip,
    );
    return result;
  }
  @Get('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('EMPLOYEE')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // ========== SESSION MANAGEMENT ==========

  @Get('me/sessions')
  @UseGuards(AuthGuard('jwt'))
  async getMySessions(@Request() req) {
    return this.usersService.getActiveSessions(req.user.userId);
  }

  @Delete('me/sessions/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  async revokeMySession(@Request() req, @Param('sessionId') sessionId: string) {
    return this.usersService.revokeSession(req.user.userId, sessionId);
  }

  @Get('admin/:id/sessions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  async getUserSessions(@Param('id') userId: string) {
    return this.usersService.adminGetUserSessions(userId);
  }

  @Delete('admin/sessions/:sessionId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  async adminRevokeSession(@Param('sessionId') sessionId: string, @Request() req) {
    const result = await this.usersService.adminRevokeSession(sessionId);
    await this.activityLogService.log(
      req.user.userId,
      'ADMIN_REVOKE_SESSION',
      { sessionId },
      undefined,
      req.ip,
    );
    return result;
  }
}
