
export enum UserRole {
    ULTIMATE_ADMIN = 'ULTIMATE_ADMIN', // 100
    SUPERADMIN = 'SUPERADMIN', // 90
    SENIOR_CHIEF_SECURITY_ADMIN = 'SENIOR_CHIEF_SECURITY_ADMIN', // 80
    CHIEF_DEVELOPMENT_ADMIN = 'CHIEF_DEVELOPMENT_ADMIN', // 70
    CHIEF_SECURITY_ADMIN = 'CHIEF_SECURITY_ADMIN', // 60
    VICE_CHIEF_SECURITY_ADMIN = 'VICE_CHIEF_SECURITY_ADMIN', // 50
    SENIOR_ADMIN = 'SENIOR_ADMIN', // 40
    ADMIN = 'ADMIN', // 35
    JUNIOR_ADMIN = 'JUNIOR_ADMIN', // 30
    EMPLOYEE = 'EMPLOYEE', // 20
    USER = 'USER', // 10
}

export const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.ULTIMATE_ADMIN]: 'Ultimate Admin (Owner)',
    [UserRole.SUPERADMIN]: 'Super Admin',
    [UserRole.SENIOR_CHIEF_SECURITY_ADMIN]: 'Sr. Chief Security Admin',
    [UserRole.CHIEF_DEVELOPMENT_ADMIN]: 'Dev. Mgmt. Chief',
    [UserRole.CHIEF_SECURITY_ADMIN]: 'Chief Security Admin',
    [UserRole.VICE_CHIEF_SECURITY_ADMIN]: 'Vice Chief Security Admin',
    [UserRole.SENIOR_ADMIN]: 'Senior Admin',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.JUNIOR_ADMIN]: 'Junior Admin',
    [UserRole.EMPLOYEE]: 'Employee Member',
    [UserRole.USER]: 'User',
};

export const ROLE_HIERARCHY_LEVELS: Record<UserRole, number> = {
    [UserRole.ULTIMATE_ADMIN]: 100,
    [UserRole.SUPERADMIN]: 90,
    [UserRole.SENIOR_CHIEF_SECURITY_ADMIN]: 80,
    [UserRole.CHIEF_DEVELOPMENT_ADMIN]: 70,
    [UserRole.CHIEF_SECURITY_ADMIN]: 60,
    [UserRole.VICE_CHIEF_SECURITY_ADMIN]: 50,
    [UserRole.SENIOR_ADMIN]: 40,
    [UserRole.ADMIN]: 35,
    [UserRole.JUNIOR_ADMIN]: 30,
    [UserRole.EMPLOYEE]: 20,
    [UserRole.USER]: 10,
};

export const getRoleColor = (role: string): string => {
    switch (role) {
        case UserRole.ULTIMATE_ADMIN: return 'bg-rose-600 text-white border-rose-700';
        case UserRole.SUPERADMIN: return 'bg-purple-600 text-white border-purple-700';
        case UserRole.SENIOR_CHIEF_SECURITY_ADMIN: return 'bg-indigo-600 text-white border-indigo-700';
        case UserRole.CHIEF_DEVELOPMENT_ADMIN: return 'bg-blue-600 text-white border-blue-700';
        case UserRole.CHIEF_SECURITY_ADMIN: return 'bg-cyan-600 text-white border-cyan-700';
        case UserRole.VICE_CHIEF_SECURITY_ADMIN: return 'bg-teal-600 text-white border-teal-700';
        case UserRole.SENIOR_ADMIN: return 'bg-emerald-600 text-white border-emerald-700';
        case UserRole.ADMIN: return 'bg-green-600 text-white border-green-700';
        case UserRole.JUNIOR_ADMIN: return 'bg-lime-600 text-white border-lime-700';
        case UserRole.EMPLOYEE: return 'bg-amber-600 text-white border-amber-700';
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
};

export const canPromoteTo = (myRole: string, targetRole: string): boolean => {
    const myLevel = ROLE_HIERARCHY_LEVELS[myRole as UserRole] || 0;
    const targetLevel = ROLE_HIERARCHY_LEVELS[targetRole as UserRole] || 0;
    return myLevel > targetLevel;
};

export const ADMIN_ROLES = [
    UserRole.ULTIMATE_ADMIN,
    UserRole.SUPERADMIN,
    UserRole.SENIOR_CHIEF_SECURITY_ADMIN,
    UserRole.CHIEF_DEVELOPMENT_ADMIN,
    UserRole.CHIEF_SECURITY_ADMIN,
    UserRole.VICE_CHIEF_SECURITY_ADMIN,
    UserRole.SENIOR_ADMIN,
    UserRole.JUNIOR_ADMIN,
    UserRole.EMPLOYEE,
    'ADMIN'
];
