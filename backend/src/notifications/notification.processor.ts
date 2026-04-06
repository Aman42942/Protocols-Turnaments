import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '../email/email.service';
import { Logger } from '@nestjs/common';

@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { type, data } = job.data;

    switch (job.name) {
      case 'tournament_created':
        return this.handleTournamentCreated(data);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleTournamentCreated(data: { userEmail: string; userName: string; tournament: any }) {
    this.logger.log(`Sending tournament notification to ${data.userEmail}`);
    await this.emailService.sendTournamentCreatedNotification(
      data.userEmail,
      data.userName,
      data.tournament,
    );
  }
}
