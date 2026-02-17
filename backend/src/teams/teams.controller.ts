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

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(req.user.userId, createTeamDto);
  }

  @Get()
  findAll() {
    return this.teamsService.findAll();
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
  @Post('invite/:code/join')
  joinByCode(@Request() req, @Param('code') code: string) {
    return this.teamsService.joinByCode(req.user.userId, code);
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
}
