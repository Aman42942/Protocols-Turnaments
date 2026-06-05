import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CashfreePayoutsService } from '../payments/cashfree-payouts.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(forwardRef(() => CashfreePayoutsService))
    private cashfreePayouts: CashfreePayoutsService,
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

    // Create audit trail for frozen funds
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (wallet) {
      await this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount,
          status: 'PENDING',
          description: `Funds locked: ${reason}`,
          metadata: JSON.stringify({ lockedAt: new Date().toISOString(), reason, isLocked: true }),
        },
      });
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

  async getWithdrawalLimits() {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        key: { in: ['WITHDRAW_LIMIT_ADMIN', 'WITHDRAW_LIMIT_SUPERADMIN'] },
      },
    });

    const configMap = configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      adminLimit: parseFloat(configMap['WITHDRAW_LIMIT_ADMIN']) || 10000,
      superAdminLimit: parseFloat(configMap['WITHDRAW_LIMIT_SUPERADMIN']) || 50000,
    };
  }

  async updateWithdrawalLimits(adminLimit: number, superAdminLimit: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.systemConfig.upsert({
        where: { key: 'WITHDRAW_LIMIT_ADMIN' },
        update: { value: adminLimit.toString() },
        create: { key: 'WITHDRAW_LIMIT_ADMIN', value: adminLimit.toString() },
      });

      await tx.systemConfig.upsert({
        where: { key: 'WITHDRAW_LIMIT_SUPERADMIN' },
        update: { value: superAdminLimit.toString() },
        create: { key: 'WITHDRAW_LIMIT_SUPERADMIN', value: superAdminLimit.toString() },
      });

      return this.getWithdrawalLimits();
    });
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

  async refundTournamentEntry(userId: string, amount: number, tournamentId: string, tournamentTitle: string, reference?: string, allowBalanceUpdate: boolean = true) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new BadRequestException('User wallet not found');

    // 1. DUPLICATE PROTECTION: Check if a refund for this specific order/reference already exists
    // We check by reference to prevent double refunds for the same transaction
    if (reference) {
      const existingRefund = await this.prisma.transaction.findFirst({
        where: {
          walletId: wallet.id,
          type: 'REFUND',
          status: 'COMPLETED',
          reference: reference, // Match by specific reference
        },
      });
  
      if (existingRefund) {
        throw new BadRequestException('A refund for this transaction reference has already been processed.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 2. Increment wallet balance (ONLY if requested)
      if (allowBalanceUpdate) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amount } },
        });
      }

      // 3. Create REFUND transaction
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'REFUND',
          status: 'COMPLETED',
          reference: reference,
          description: allowBalanceUpdate 
            ? `Refund for tournament: ${tournamentTitle}`
            : `Gateway Refund for tournament: ${tournamentTitle} (No Wallet Credit)`,
          metadata: JSON.stringify({ 
            tournamentId, 
            userId, 
            refundedAt: new Date().toISOString(), 
            originalReference: reference,
            isGatewayRefund: !allowBalanceUpdate
          }),
        },
      });

      return transaction;
    });
  }

  // --- ADMIN: Manual Balance Adjustment (For recovery or rewards) ---
  async adjustBalance(userId: string, amount: number, type: 'DEPOSIT' | 'WITHDRAWAL', reason: string, adminId: string) {
    const wallet = await this.getWallet(userId);

    if (type === 'WITHDRAWAL' && wallet.balance < Math.abs(amount)) {
      throw new BadRequestException('Insufficient balance to perform deduction');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: type === 'DEPOSIT' ? { increment: amount } : { decrement: Math.abs(amount) },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: Math.abs(amount),
          type: type === 'DEPOSIT' ? 'DEPOSIT' : 'WITHDRAWAL',
          status: 'COMPLETED',
          description: `Admin Adjustment: ${reason} (Ref: ${adminId})`,
          metadata: JSON.stringify({ adminId, originalReason: reason, adjustedAt: new Date().toISOString(), isAdminAdjustment: true }),
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  async deleteAdminAdjustment(transactionId: string, adminId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!tx) throw new NotFoundException('Transaction not found');

    // Security check: Ensure it's an admin adjustment
    let metadata: any = {};
    try {
      if (tx.metadata) metadata = JSON.parse(tx.metadata);
    } catch (e) { }

    const isAdjustment = tx.description?.startsWith('Admin Adjustment:') || metadata.isAdminAdjustment;

    if (!isAdjustment) {
      throw new BadRequestException('Only manual admin adjustments can be deleted/undone.');
    }

    return this.prisma.$transaction(async (prismaTx) => {
      // Revert the balance
      // If it was a DEPOSIT, we subtract it. If it was a WITHDRAWAL, we add it back.
      const amountToApply = tx.type === 'DEPOSIT' ? -tx.amount : tx.amount;

      await prismaTx.wallet.update({
        where: { id: tx.walletId },
        data: { balance: { increment: amountToApply } },
      });

      // Delete the transaction record
      await prismaTx.transaction.delete({
        where: { id: transactionId },
      });

      return { success: true, revertedAmount: amountToApply };
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
      const [updatedTx, updatedWallet] = await this.prisma.$transaction(async (txPrisma) => {
        const txUpdate = await txPrisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            description: `${tx.description} — APPROVED`,
          },
        });

        const walletUpdate = await txPrisma.wallet.update({
          where: { id: tx.walletId },
          data: { balance: { increment: tx.amount } },
        });

        // --- AUTO-APPROVE TOURNAMENT REGISTRATION (Now Atomic) ---
        if (tx.metadata) {
          try {
            const meta = JSON.parse(tx.metadata);
            if (meta.tournamentId) {
              const participant = await txPrisma.tournamentParticipant.findFirst({
                where: {
                  userId: tx.wallet.userId,
                  tournamentId: meta.tournamentId,
                  status: 'PENDING',
                },
              });

              if (participant) {
                await txPrisma.tournamentParticipant.update({
                  where: { id: participant.id },
                  data: {
                    status: 'APPROVED',
                    paymentStatus: 'PAID',
                    paymentId: tx.reference,
                  },
                });
                console.log(`[AUTO-APPROVE] User ${tx.wallet.userId} approved for tournament ${meta.tournamentId}`);
              }
            }
          } catch (e) {
            console.error('[AUTO-APPROVE ERROR] Failed to parse metadata:', e);
            // We might choose to throw here or just log. In financial transactions, failing safe is better.
            throw new Error('Failed to process tournament registration during approval');
          }
        }

        return [txUpdate, walletUpdate];
      });

      return { transaction: updatedTx, wallet: updatedWallet };
    } else if (tx.type === 'WITHDRAWAL') {
      // Logic for Withdrawal: Check if it's a Cashfree-supported request (UPI/INR)
      const isCashfreeEligible = tx.method === 'UPI' && tx.currency === 'INR';

      if (isCashfreeEligible) {
        let metadata: any = {};
        try {
          if (tx.metadata) metadata = JSON.parse(tx.metadata);
        } catch (e) { }

        if (!metadata.upiId) {
          throw new BadRequestException('Cannot automate payout: UPI ID is missing in transaction metadata.');
        }

        const user = await this.prisma.user.findUnique({ where: { id: tx.wallet.userId } });
        const transferId = `WD_${tx.id.substring(0, 8)}_${Date.now()}`;

        try {
          console.log(`[CASHFREE AUTO-PAYOUT] Initiating for TX: ${tx.id} | User: ${user?.name} | Amount: ₹${tx.amount}`);
          
          await this.cashfreePayouts.requestTransfer({
            transferId,
            amount: tx.amount,
            name: user?.name || 'Protocol User',
            email: user?.email || undefined,
            vpa: metadata.upiId,
            remark: `Withdrawal Ref: ${tx.id.substring(0, 8)}`,
          });

          // Update transaction with the transfer reference
          const updatedTx = await this.prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: 'PENDING', // Keep as PENDING, webhook will move it to COMPLETED
              reference: transferId,
              description: `${tx.description} — PROCESSING via Cashfree (Ref: ${transferId})`,
            },
          });

          return { transaction: updatedTx, message: 'Payout initiated via Cashfree. Waiting for confirmation.' };

        } catch (error: any) {
          console.error('[CASHFREE AUTO-PAYOUT ERROR]', error.message);
          throw new BadRequestException(`Cashfree Payout failed: ${error.message}`);
        }
      } else {
        // Fallback for non-automated methods (e.g. PayPal manually handled for now, or GBP/USD)
        const [updatedTx] = await this.prisma.$transaction([
          this.prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: 'COMPLETED',
              description: `${tx.description} — PROCESSED MANUALLY`,
            },
          }),
          this.prisma.wallet.update({
            where: { id: tx.walletId },
            data: { frozenBalance: { decrement: tx.amount } },
          }),
        ]);
        return { transaction: updatedTx, message: 'Withdrawal marked as completed manually.' };
      }
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
          data: { 
            balance: { increment: tx.amount },
            frozenBalance: { decrement: tx.amount }
          },
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
    amount: number, // Represents the final Coins to add
    method: string,
    reference?: string,
    metadata?: string,
    currency: string = 'INR',
    conversionRate: number = 1.0,
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
  
    // 1. Double-Spending Protection: Ensure reference is unique for COMPLETED deposits
    if (reference) {
      const existing = await this.prisma.transaction.findFirst({
        where: { reference, type: 'DEPOSIT', status: 'COMPLETED' },
      });
      if (existing) {
        throw new BadRequestException('This transaction reference has already been processed.');
      }
    }

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
          currency,
          conversionRate,
          status: 'COMPLETED',
          method: method || 'UPI',
          reference,
          metadata,
          description: `Deposit via ${method || 'UPI'}`,
        },
      }),
    ]);

    return { wallet: updatedWallet, transaction };
  }

  async withdraw(userId: string, amount: number, targetCurrency: string, method: string, metadata?: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    // 1. Fetch Conversion Rate if needed
    let conversionRate = 1.0;
    if (targetCurrency === 'USD') {
      const config = await this.prisma.systemConfig.findUnique({ where: { key: 'PAYPAL_EXCHANGE_RATE' } });
      conversionRate = Number(config?.value) || 85.0;
    } else if (targetCurrency === 'GBP') {
      const config = await this.prisma.systemConfig.findUnique({ where: { key: 'GBP_TO_COIN_RATE' } });
      conversionRate = Number(config?.value) || 110.0;
    }

    const realWorldValue = (amount / conversionRate).toFixed(2);
    const symbol = targetCurrency === 'USD' ? '$' : targetCurrency === 'GBP' ? '£' : '₹';

    // 2. Validate Metadata (UPI or PayPal Email)
    if (metadata) {
      try {
        const meta = JSON.parse(metadata);
        if (targetCurrency === 'INR' && meta.upiId) {
          const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
          if (!upiRegex.test(meta.upiId)) {
            throw new BadRequestException('Invalid UPI ID format. Expected: username@bank');
          }
        }
        if ((targetCurrency === 'USD' || targetCurrency === 'GBP') && meta.paypalEmail) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(meta.paypalEmail)) {
            throw new BadRequestException('Invalid PayPal Email format.');
          }
        }
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
        throw new BadRequestException('Invalid metadata format.');
      }
    }

    try {
      const [updatedWallet, transaction] = await this.prisma.$transaction(
        async (tx) => {
          // Atomic update with balance check: Move from balance to frozenBalance
          const wallet = await tx.wallet.update({
            where: {
              userId,
              balance: { gte: amount },
            },
            data: { 
              balance: { decrement: amount },
              frozenBalance: { increment: amount }
            },
          });

          const newTx = await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'WITHDRAWAL',
              amount,
              currency: targetCurrency,
              conversionRate,
              status: 'PENDING',
              method: method || (targetCurrency === 'INR' ? 'UPI' : 'PAYPAL'),
              description: `Withdrawal of ${amount} Coins (${symbol}${realWorldValue}) via ${targetCurrency}`,
              metadata,
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
    if (amount <= 0) throw new BadRequestException('Entry fee amount must be positive');

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
