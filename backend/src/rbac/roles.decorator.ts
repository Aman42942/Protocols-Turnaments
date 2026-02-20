import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.enum';

export const ROLES_KEY = 'roles';

/**
 * @Roles() decorator — attach to any controller or route handler.
 *
 * @example
 * @Roles(Role.ADMIN)           // Requires ADMIN or higher
 * @Roles(Role.SUPERADMIN)      // Only SUPERADMIN
 * @Roles(Role.MODERATOR)       // MODERATOR, ADMIN, or SUPERADMIN
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
