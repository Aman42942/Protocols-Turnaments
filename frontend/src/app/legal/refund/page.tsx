import LegalPage from '@/components/LegalPage';
import { CreditCard } from 'lucide-react';

export default function RefundPage() {
    return (
        <LegalPage
            cmsKey="LEGAL_REFUND"
            title="Refund Policy"
            subtitle="Our commitment to fair and transparent refunds"
            icon={<CreditCard className="w-7 h-7 text-amber-400" />}
            fallbackContent={`1. Tournament Cancellation
If a tournament is cancelled by the organizer before it begins, a full coin credit is issued to all registered participants within 24 hours.

2. Entry Fee Refunds
- Entry fees are non-refundable once a tournament officially begins.
- If a match is cancelled by the admin before it starts, the entry fee is refunded to your coin wallet.

3. Withdrawal Refunds
- Failed withdrawals are automatically refunded to your coin wallet within 1-3 business days.
- If a withdrawal is rejected by admin, coins are immediately returned to your balance.

4. Payment Processing Fees
- Gateway processing fees (Cashfree/PayPal) are non-refundable once the transaction is completed.

5. Contact Us
For refund disputes, please email support@protocolapp.com within 7 days of the transaction.`}
        />
    );
}
