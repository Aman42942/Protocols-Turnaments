import LegalPage from '@/components/LegalPage';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <LegalPage
            cmsKey="LEGAL_PRIVACY"
            title="Privacy Policy"
            subtitle="How we collect, use, and protect your information"
            icon={<Shield className="w-7 h-7 text-green-400" />}
            fallbackContent={`At Protocol Tournament, we take your privacy seriously.

1. Information We Collect
- Account Info: Email, username, and encrypted password.
- Game Data: In-game IDs (e.g., Valorant Riot ID) for match verification.
- Payment Info: Transaction IDs and history. We do NOT store full card details; these are handled by Cashfree & PayPal.

2. How We Use Data
We use your data to organize tournaments, verify match results, process winnings, and prevent fraud.

3. Data Security
Your data is stored using industry-standard encryption. We never sell your personal information to third parties.

4. Cookies
We use cookies to keep you logged in and remember your preferences.

5. Your Rights
You may request data deletion by contacting support@protocolapp.com.`}
        />
    );
}
