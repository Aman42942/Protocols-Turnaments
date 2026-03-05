import LegalPage from '@/components/LegalPage';
import { Scale } from 'lucide-react';

export default function TermsPage() {
    return (
        <LegalPage
            cmsKey="LEGAL_TERMS"
            title="Terms & Conditions"
            subtitle="Please read these terms carefully before using Protocol Tournament"
            icon={<Scale className="w-7 h-7 text-primary" />}
            fallbackContent={`1. Eligibility
Participants must be at least 13 years of age. Some cash tournaments may require participants to be 18+ depending on local jurisdiction.

2. Fair Play
Cheating, using third-party software, or exploiting game bugs is strictly prohibited and will result in a permanent ban and forfeiture of all winnings.

3. Platform Fees
Protocol Tournament may charge a nominal service fee on entry fees and withdrawals to maintain the platform.

4. Dispute Resolution
Tournament admins have the final say in all match-related disputes. Evidence (screenshots/recordings) must be provided for any claims.`}
        />
    );
}
