export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
}

/**
 * Role hierarchy — higher index = more permissions.
 * Used by RolesGuard to check if a user's role is sufficient.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 0,
  [Role.MODERATOR]: 1,
  [Role.ADMIN]: 2,
  [Role.SUPERADMIN]: 3,
};

/**
 * Returns true if `userRole` meets or exceeds `requiredRole` in hierarchy.
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
