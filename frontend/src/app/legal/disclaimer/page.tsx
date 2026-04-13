import LegalPage from '@/components/LegalPage';
import { Gamepad2 } from 'lucide-react';

export default function DisclaimerPage() {
    return (
        <LegalPage
            cmsKey="LEGAL_DISCLAIMER"
            title="Skill-Based Game Disclaimer"
            subtitle="Protocol Tournament is a competitive skill-based gaming platform"
            icon={<Gamepad2 className="w-7 h-7 text-purple-400" />}
            fallbackContent={`Protocol Tournament is a skill-based gaming platform.

1. Skill-Based Games
Outcomes on this platform are determined primarily by player skill, strategy, and knowledge — NOT chance or luck.

2. No Gambling
This platform does not operate as a gambling service. Entry fees are collected to fund prize pools that are distributed to top performers based on merit and competitive performance.

3. Jurisdiction
Users are responsible for ensuring that participation is legal in their jurisdiction. The platform is not available in states/territories where skill-based gaming competitions are prohibited by law.

4. Age Restriction
Users must be 18+ to participate in paid tournaments. By registering, you confirm that you meet this age requirement.

5. Responsible Gaming
We encourage responsible participation. If you feel you are developing unhealthy habits around competitive gaming, please seek assistance.

Contact: support@protocolapp.com`}
        />
    );
}
