import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ADMIN_ROLES = [
    'ULTIMATE_ADMIN', 'SUPERADMIN',
    'SENIOR_CHIEF_SECURITY_ADMIN', 'CHIEF_DEVELOPMENT_ADMIN',
    'CHIEF_SECURITY_ADMIN', 'VICE_CHIEF_SECURITY_ADMIN',
    'SENIOR_ADMIN', 'JUNIOR_ADMIN', 'EMPLOYEE', 'ADMIN'
];

export function useAdminAuth() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            try {
                const token = localStorage.getItem('token');
                const userStr = localStorage.getItem('user');

                if (!token || !userStr) {
                    router.push('/');
                    return;
                }

                const user = JSON.parse(userStr);

                if (!user.role || !ADMIN_ROLES.includes(user.role)) {
                    router.push('/');
                    return;
                }

                setIsAdmin(true);
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    return { isAdmin, loading };
}
