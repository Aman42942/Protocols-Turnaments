import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { EscrowService } from '../tournaments/escrow.service';

export const PAYOUT_QUEUE = 'payout';
export const PAYOUT_JOB_DISTRIBUTE = 'distribute';
export const PAYOUT_JOB_REFUND = 'refund';

export interface PayoutJobData {
  tournamentId: string;
  adminId: string;
}

/**
 * Payout Processor
 * Handles async prize distribution and refund jobs.
 * Decouples payout from the HTTP request cycle.
 */
@Processor(PAYOUT_QUEUE)
@Injectable()
export class PayoutProcessor extends WorkerHost {
  private readonly logger = new Logger(PayoutProcessor.name);

  constructor(private readonly escrow: EscrowService) {
    super();
  }

  async process(job: Job<PayoutJobData>): Promise<any> {
    const { tournamentId, adminId } = job.data;

    switch (job.name) {
      case PAYOUT_JOB_DISTRIBUTE: {
        this.logger.log(
          `[${job.id}] Distributing prizes for tournament ${tournamentId}`,
        );
        const result = await this.escrow.distributePool(tournamentId, adminId);
        this.logger.log(
          `[${job.id}] Distribution complete: ${JSON.stringify(result)}`,
        );
        return result;
      }

      case PAYOUT_JOB_REFUND: {
        this.logger.log(`[${job.id}] Refunding tournament ${tournamentId}`);
        const result = await this.escrow.refundPool(tournamentId, adminId);
        this.logger.log(
          `[${job.id}] Refund complete: ${JSON.stringify(result)}`,
        );
        return result;
      }

      default:
        this.logger.warn(`[${job.id}] Unknown payout job name: ${job.name}`);
    }
  }
}
