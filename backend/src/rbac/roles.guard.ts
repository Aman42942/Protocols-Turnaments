import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, hasRole } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';

/**
 * RolesGuard
 *
 * Reads the minimum required role from @Roles() decorator metadata,
 * then checks the authenticated user's role against the hierarchy.
 *
 * Usage (on controller or route):
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(Role.ADMIN)
 *
 * Hierarchy: SUPERADMIN > ADMIN > MODERATOR > USER
 * If no @Roles() is set, the guard allows access (JwtAuthGuard handles auth).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() set — allow (JwtAuthGuard already verified authentication)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('No role assigned to user');
    }

    const userRole = user.role as Role;

    // User must meet AT LEAST ONE of the required roles
    const allowed = requiredRoles.some((required) =>
      hasRole(userRole, required),
    );

    if (!allowed) {
      throw new ForbiddenException(
        `Access denied. Required: ${requiredRoles.join(' or ')}, your role: ${userRole}`,
      );
    }

    return true;
  }
}
