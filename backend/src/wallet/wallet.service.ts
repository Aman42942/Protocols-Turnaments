import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) { }

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
        include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
      });
    }

    return wallet;
  }

  // Lock funds (Move from Balance -> Frozen)
  async lockFunds(userId: string, amount: number, reason: string) {
    if (amount < 0) throw new BadRequestException('Amount cannot be negative');

    // Using atomic update with condition to prevent race conditions
    const result = await this.prisma.wallet.updateMany({
      where: {
        userId,
        balance: { gte: amount },
      },
      data: {
        balance: { decrement: amount },
        frozenBalance: { increment: amount },
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('Insufficient balance to lock funds');
    }
  }

  // Unlock funds (Move from Frozen -> Balance) e.g. Refund
  async unlockFunds(userId: string, amount: number, reason: string) {
    const wallet = await this.getWallet(userId);
    // Note: We might want to check if frozenBalance >= amount, but in some edge cases (admin override) it might differ.
    // Safe check:
    if (wallet.frozenBalance < amount)
      throw new BadRequestException('Insufficient frozen balance');

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: amount },
        frozenBalance: { decrement: amount },
      },
    });

    // Log the refund/unlock
    await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'REFUND',
        amount,
        status: 'COMPLETED',
        description: `Refund/Unlock: ${reason}`,
      },
    });
  }

  // Capture funds (Frozen -> Burn/Transfer) e.g. Dispute resolved against user
  async captureFunds(userId: string, amount: number, reason: string) {
    const wallet = await this.getWallet(userId);
    if (wallet.frozenBalance < amount)
      throw new BadRequestException('Insufficient frozen balance');

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { frozenBalance: { decrement: amount } },
    });
    // Funds are effectively 'burned' from user perspective or moved to admin wallet (not impl here)
  }

  async getUpiDetails() {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        key: { in: ['UPI_ID', 'UPI_MERCHANT_NAME'] },
      },
    });

    const configMap = configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      upiId:
        configMap['UPI_ID'] ||
        this.configService.get<string>('UPI_ID') ||
        'keeps@ptyes',
      merchantName:
        configMap['UPI_MERCHANT_NAME'] ||
        this.configService.get<string>('UPI_MERCHANT_NAME') ||
        'Protocol Tournament Support',
    };
  }

  async updateUpiSettings(upiId: string, merchantName: string) {
    return this.prisma.$transaction(async (tx) => {
      // Upsert UPI_ID
      await tx.systemConfig.upsert({
        where: { key: 'UPI_ID' },
        update: { value: upiId },
        create: { key: 'UPI_ID', value: upiId },
      });

      // Upsert UPI_MERCHANT_NAME
      await tx.systemConfig.upsert({
        where: { key: 'UPI_MERCHANT_NAME' },
        update: { value: merchantName },
        create: { key: 'UPI_MERCHANT_NAME', value: merchantName },
      });

      return this.getUpiDetails();
    });
  }

  async refundTournamentEntry(userId: string, amount: number, tournamentId: string, tournamentTitle: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new BadRequestException('User wallet not found');

    return this.prisma.$transaction(async (tx) => {
      // 1. Increment wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      // 2. Create REFUND transaction
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'REFUND',
          status: 'COMPLETED',
          description: `Refund for tournament: ${tournamentTitle}`,
          metadata: JSON.stringify({ tournamentId, userId }),
        },
      });

      return transaction;
    });
  }

  async createQrDeposit(userId: string, amount: number, utrNumber: string, metadata?: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (amount < 10) throw new BadRequestException('Minimum deposit is ₹10');
    if (!utrNumber || utrNumber.trim().length < 6) {
      throw new BadRequestException(
        'Please enter a valid UTR/Transaction Reference Number',
      );
    }

    const existingTx = await this.prisma.transaction.findFirst({
      where: { reference: utrNumber.trim() },
    });
    if (existingTx) {
      throw new BadRequestException(
        'This UTR number has already been submitted',
      );
    }

    const wallet = await this.getWallet(userId);

    const transaction = await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount,
        status: 'PENDING',
        method: 'UPI_QR',
        reference: utrNumber.trim(),
        description: `QR deposit of ₹${amount} — UTR: ${utrNumber.trim()}`,
        metadata,
      },
    });

    return {
      transaction,
      message:
        'Deposit request submitted! It will be verified within 5-10 minutes.',
    };
  }

  async getPendingDeposits() {
    return this.prisma.transaction.findMany({
      where: { type: 'DEPOSIT', status: 'PENDING', method: 'UPI_QR' },
      include: {
        wallet: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllTransactions(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        include: {
          wallet: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count(),
    ]);
    return { transactions, total, page, limit };
  }

  async approveTransaction(transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status !== 'PENDING')
      throw new BadRequestException('Transaction is not pending');

    if (tx.type === 'DEPOSIT') {
      const [updatedTx, updatedWallet] = await this.prisma.$transaction([
        this.prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            description: `${tx.description} — APPROVED`,
          },
        }),
        this.prisma.wallet.update({
          where: { id: tx.walletId },
          data: { balance: { increment: tx.amount } },
        }),
      ]);

      // --- AUTO-APPROVE TOURNAMENT REGISTRATION ---
      if (tx.metadata) {
        try {
          const meta = JSON.parse(tx.metadata);
          if (meta.tournamentId) {
            // Find the pending registration for this user and tournament
            const participant = await this.prisma.tournamentParticipant.findFirst({
              where: {
                userId: tx.wallet.userId,
                tournamentId: meta.tournamentId,
                status: 'PENDING'
              }
            });

            if (participant) {
              await this.prisma.tournamentParticipant.update({
                where: { id: participant.id },
                data: {
                  status: 'APPROVED',
                  paymentStatus: 'PAID',
                  paymentId: tx.reference
                }
              });
              console.log(`[AUTO-APPROVE] User ${tx.wallet.userId} approved for tournament ${meta.tournamentId}`);
            }
          }
        } catch (e) {
          console.error('[AUTO-APPROVE ERROR] Failed to parse metadata or approve:', e);
        }
      }

      return { transaction: updatedTx, wallet: updatedWallet };
    } else if (tx.type === 'WITHDRAWAL') {
      const updatedTx = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          description: `${tx.description} — PROCESSED`,
        },
      });
      return { transaction: updatedTx };
    }

    throw new BadRequestException('Unsupported transaction type for approval');
  }

  async rejectTransaction(transactionId: string, reason?: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status !== 'PENDING')
      throw new BadRequestException('Transaction is not pending');

    if (tx.type === 'WITHDRAWAL') {
      // Withdrawal rejected -> REFUND the balance to user
      const [updatedTx, updatedWallet] = await this.prisma.$transaction([
        this.prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'FAILED',
            description: `${tx.description} — REJECTED: ${reason || 'Invalid details'}`,
          },
        }),
        this.prisma.wallet.update({
          where: { id: tx.walletId },
          data: { balance: { increment: tx.amount } },
        }),
      ]);
      return { transaction: updatedTx, wallet: updatedWallet };
    }

    const updatedTx = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        description: `${tx.description} — REJECTED${reason ? ': ' + reason : ''}`,
      },
    });

    return { transaction: updatedTx };
  }

  async deposit(
    userId: string,
    amount: number,
    method: string,
    reference?: string,
    metadata?: string,
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const wallet = await this.getWallet(userId);

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          amount,
          status: 'COMPLETED',
          method: method || 'UPI',
          reference,
          metadata,
          description: `Deposit of ₹${amount} via ${method || 'UPI'}`,
        },
      }),
    ]);

    return { wallet: updatedWallet, transaction };
  }

  async withdraw(userId: string, amount: number, method: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    try {
      const [updatedWallet, transaction] = await this.prisma.$transaction(
        async (tx) => {
          // Atomic update with balance check
          const wallet = await tx.wallet.update({
            where: {
              userId,
              balance: { gte: amount },
            },
            data: { balance: { decrement: amount } },
          });

          const newTx = await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'WITHDRAWAL',
              amount,
              status: 'PENDING',
              method: method || 'BANK_TRANSFER',
              description: `Withdrawal of ₹${amount} via ${method || 'Bank Transfer'}`,
            },
          });

          return [wallet, newTx];
        },
      );

      return { wallet: updatedWallet, transaction };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Insufficient balance for withdrawal');
      }
      throw error;
    }
  }

  async deductEntryFee(userId: string, amount: number, tournamentName: string) {
    if (amount < 0) throw new BadRequestException('Amount cannot be negative');

    try {
      const [updatedWallet, transaction] = await this.prisma.$transaction(
        async (tx) => {
          // Atomic update with balance check
          const wallet = await tx.wallet.update({
            where: {
              userId,
              balance: { gte: amount },
            },
            data: { balance: { decrement: amount } },
          });

          const newTx = await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'ENTRY_FEE',
              amount,
              status: 'COMPLETED',
              description: `Entry fee for ${tournamentName}`,
            },
          });

          return [wallet, newTx];
        },
      );

      return { wallet: updatedWallet, transaction };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Insufficient balance for entry fee');
      }
      throw error;
    }
  }

  async creditWinnings(userId: string, amount: number, tournamentName: string) {
    const wallet = await this.getWallet(userId);

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WINNINGS',
          amount,
          status: 'COMPLETED',
          description: `Winnings from ${tournamentName}`,
        },
      }),
    ]);

    return { wallet: updatedWallet, transaction };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.getWallet(userId);
    const skip = (page - 1) * limit;

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { walletId: wallet.id } }),
    ]);

    return { transactions, total, page, limit };
  }

  async getTransactionById(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: { wallet: true },
    });
  }

  async getWalletById(id: string) {
    return this.prisma.wallet.findUnique({
      where: { id },
    });
  }
}
