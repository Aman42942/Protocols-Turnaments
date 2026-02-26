import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

export const NOTIFICATION_QUEUE = 'notification';
export const NOTIF_JOB_TOURNAMENT_START = 'tournament_start';
export const NOTIF_JOB_PRIZE_SENT = 'prize_sent';
export const NOTIF_JOB_REFUND_ISSUED = 'refund_issued';
export const NOTIF_JOB_MATCH_RESULT = 'match_result';

export interface TournamentStartJobData {
  tournamentId: string;
  tournamentTitle: string;
  startDate: string;
}

export interface PrizeSentJobData {
  userId: string;
  amount: number;
  tournamentTitle: string;
  place: string;
}

export interface RefundJobData {
  userId: string;
  amount: number;
  tournamentTitle: string;
}

/**
 * Notification Processor
 * Sends emails and records in-app notifications asynchronously.
 */
@Processor(NOTIFICATION_QUEUE)
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly email: EmailService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case NOTIF_JOB_TOURNAMENT_START: {
        const { tournamentId, tournamentTitle, startDate } =
          job.data as TournamentStartJobData;
        this.logger.log(
          `[${job.id}] Notifying participants of ${tournamentTitle} starting`,
        );

        // Get all approved participants
        const participants = await this.prisma.tournamentParticipant.findMany({
          where: { tournamentId, status: 'APPROVED' },
          include: { user: { select: { email: true, name: true } } },
        });

        for (const p of participants) {
          if (!p.user?.email) continue;
          // Send email (fire & forget per participant)
          await this.email
            .sendGenericEmail(
              p.user.email,
              `🏆 ${tournamentTitle} is starting!`,
              `<p>Hi ${p.user.name},</p><p>Your tournament <strong>${tournamentTitle}</strong> is starting at ${new Date(startDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Get ready!</p>`,
            )
            .catch((e) =>
              this.logger.error(
                `Email failed for ${p.user.email}: ${e.message}`,
              ),
            );
        }
        return { sent: participants.length };
      }

      case NOTIF_JOB_PRIZE_SENT: {
        const { userId, amount, tournamentTitle, place } =
          job.data as PrizeSentJobData;
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });
        if (!user?.email) return;

        await this.email
          .sendGenericEmail(
            user.email,
            `💰 You won ₹${amount} in ${tournamentTitle}!`,
            `<p>Congratulations ${user.name}! You finished <strong>${place}</strong> in <strong>${tournamentTitle}</strong>. ₹${amount} has been credited to your wallet.</p>`,
          )
          .catch((e) => this.logger.error(`Prize email failed: ${e.message}`));

        // In-app notification
        await this.prisma.notification
          .create({
            data: {
              userId,
              type: 'WINNINGS',
              title: `🏆 Prize received!`,
              message: `You won ₹${amount} from ${tournamentTitle} (${place} place)`,
            },
          })
          .catch(() => {});

        return { sent: user.email };
      }

      case NOTIF_JOB_REFUND_ISSUED: {
        const { userId, amount, tournamentTitle } = job.data as RefundJobData;
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });
        if (!user?.email) return;

        await this.email
          .sendGenericEmail(
            user.email,
            `Refund: ₹${amount} returned for ${tournamentTitle}`,
            `<p>Hi ${user.name}, ₹${amount} has been refunded to your wallet for "${tournamentTitle}" which was cancelled. We apologize for the inconvenience.</p>`,
          )
          .catch((e) => this.logger.error(`Refund email failed: ${e.message}`));

        await this.prisma.notification
          .create({
            data: {
              userId,
              type: 'REFUND',
              title: 'Refund Processed',
              message: `₹${amount} refunded from cancelled tournament: ${tournamentTitle}`,
            },
          })
          .catch(() => {});

        return { sent: user.email };
      }

      default:
        this.logger.warn(`[${job.id}] Unknown notification job: ${job.name}`);
    }
  }
}
