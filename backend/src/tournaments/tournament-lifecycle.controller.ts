import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TournamentLifecycleService } from './tournament-lifecycle.service';
import { EscrowService } from './escrow.service';
import { ResultLockService } from './result-lock.service';

@Controller('tournaments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TournamentLifecycleController {
  constructor(
    private readonly lifecycle: TournamentLifecycleService,
    private readonly escrow: EscrowService,
    private readonly resultLock: ResultLockService,
  ) {}

  // ====== LIFECYCLE ======

  /**
   * GET /tournaments/:id/lifecycle
   * Get current status + allowed next transitions
   */
  @Get(':id/lifecycle')
  @Roles('ADMIN', 'SUPERADMIN')
  async getLifecycle(@Param('id') id: string) {
    return this.lifecycle.getLifecycleState(id);
  }

  /**
   * POST /tournaments/:id/transition
   * Body: { status: 'OPEN' | 'LIVE' | 'COMPLETED' | 'CANCELLED', reason?: string }
   */
  @Post(':id/transition')
  @Roles('ADMIN', 'SUPERADMIN')
  async transition(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @Req() req,
  ) {
    const adminId = req.user['id'] || req.user['sub'];
    const updated = await this.lifecycle.transition(
      id,
      body.status,
      adminId,
      body.reason,
    );

    // Auto-lock escrow when going LIVE
    if (body.status === 'LIVE') {
      try {
        await this.escrow.lockPool(id, adminId);
      } catch (e) {
        // If no escrow pool (free tournament), skip silently
      }
    }

    // Auto-distribute prizes when COMPLETED
    if (body.status === 'COMPLETED') {
      try {
        await this.escrow.distributePool(id, adminId);
      } catch (e) {
        // If distribution fails, log but don't block the status change
        console.error('[EscrowService] Auto-distribution failed:', e.message);
      }
    }

    // Auto-refund when CANCELLED
    if (body.status === 'CANCELLED') {
      try {
        await this.escrow.refundPool(id, adminId);
      } catch (e) {
        console.error('[EscrowService] Auto-refund failed:', e.message);
      }
    }

    return updated;
  }

  // ====== ESCROW ======

  /**
   * GET /tournaments/:id/escrow
   */
  @Get(':id/escrow')
  @Roles('ADMIN', 'SUPERADMIN')
  async getPool(@Param('id') id: string) {
    return this.escrow.getPool(id);
  }

  /**
   * POST /tournaments/:id/escrow/distribute
   * Manual prize distribution trigger (if auto failed)
   */
  @Post(':id/escrow/distribute')
  @Roles('SUPERADMIN')
  async distribute(@Param('id') id: string, @Req() req) {
    const adminId = req.user['id'] || req.user['sub'];
    return this.escrow.distributePool(id, adminId);
  }

  /**
   * POST /tournaments/:id/escrow/refund
   * Manual refund trigger
   */
  @Post(':id/escrow/refund')
  @Roles('SUPERADMIN')
  async refund(@Param('id') id: string, @Req() req) {
    const adminId = req.user['id'] || req.user['sub'];
    return this.escrow.refundPool(id, adminId);
  }

  // ====== RESULT LOCK ======

  /**
   * POST /tournaments/matches/:matchId/lock
   */
  @Post('matches/:matchId/lock')
  @Roles('ADMIN', 'SUPERADMIN')
  async lockResult(@Param('matchId') matchId: string, @Req() req) {
    const adminId = req.user['id'] || req.user['sub'];
    return this.resultLock.lockResult(matchId, adminId);
  }

  /**
   * PATCH /tournaments/matches/:matchId/override
   * Body: { reason: string }
   */
  @Patch('matches/:matchId/override')
  @Roles('SUPERADMIN')
  async overrideResult(
    @Param('matchId') matchId: string,
    @Body() body: { reason: string },
    @Req() req,
  ) {
    const superAdminId = req.user['id'] || req.user['sub'];
    return this.resultLock.overrideResult(matchId, superAdminId, body.reason);
  }

  /**
   * GET /tournaments/matches/:matchId/lock
   */
  @Get('matches/:matchId/lock')
  @Roles('ADMIN', 'SUPERADMIN')
  async getLockAudit(@Param('matchId') matchId: string) {
    return this.resultLock.getLockAudit(matchId);
  }
}
