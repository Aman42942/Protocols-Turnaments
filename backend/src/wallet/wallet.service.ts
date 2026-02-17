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

  // Get or create wallet for a user
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

  // Get UPI payment details for QR code
  getUpiDetails() {
    return {
      upiId:
        this.configService.get<string>('UPI_ID') || 'protocoltournament@upi',
      merchantName:
        this.configService.get<string>('UPI_MERCHANT_NAME') ||
        'Protocol Tournament',
    };
  }

  // Create a pending QR deposit (user has scanned QR and paid)
  async createQrDeposit(userId: string, amount: number, utrNumber: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (amount < 10) throw new BadRequestException('Minimum deposit is ₹10');
    if (!utrNumber || utrNumber.trim().length < 6) {
      throw new BadRequestException(
        'Please enter a valid UTR/Transaction Reference Number',
      );
    }

    // Check for duplicate UTR
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
      },
    });

    return {
      transaction,
      message:
        'Deposit request submitted! It will be verified within 5-10 minutes.',
    };
  }

  // Admin: Get all pending deposits
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

  // Admin: Get all transactions for the admin panel
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

  // Admin: Approve a pending transaction (Deposit/Withdrawal)
  async approveTransaction(transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status !== 'PENDING')
      throw new BadRequestException('Transaction is not pending');

    if (tx.type === 'DEPOSIT') {
      // Credits user balance
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
      return { transaction: updatedTx, wallet: updatedWallet };
    } else if (tx.type === 'WITHDRAWAL') {
      // Balance was already decremented during withdrawal request
      // Just mark as completed
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

  // Admin: Reject a pending transaction
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

  // Add money (deposit) — instant (used by Razorpay callback)
  async deposit(
    userId: string,
    amount: number,
    method: string,
    reference?: string,
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
          description: `Deposit of ₹${amount} via ${method || 'UPI'}`,
        },
      }),
    ]);

    return { wallet: updatedWallet, transaction };
  }

  // Withdraw money
  async withdraw(userId: string, amount: number, method: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const wallet = await this.getWallet(userId);
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount,
          status: 'PENDING',
          method: method || 'BANK_TRANSFER',
          description: `Withdrawal of ₹${amount} via ${method || 'Bank Transfer'}`,
        },
      }),
    ]);

    return { wallet: updatedWallet, transaction };
  }

  // Deduct entry fee
  async deductEntryFee(userId: string, amount: number, tournamentName: string) {
    const wallet = await this.getWallet(userId);
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance for entry fee');
    }

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'ENTRY_FEE',
          amount,
          status: 'COMPLETED',
          description: `Entry fee for ${tournamentName}`,
        },
      }),
    ]);

    return { wallet: updatedWallet, transaction };
  }

  // Credit winnings
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

  // Get transaction history
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
}
