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
  ) {}

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
}
