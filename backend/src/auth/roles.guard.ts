import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, ROLE_HIERARCHY } from './role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) return false;

    const userLevel = ROLE_HIERARCHY[user.role as UserRole] || 0;

    // Check if user level is >= any of the required role levels
    return requiredRoles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role as UserRole] || 0;
      return userLevel >= requiredLevel;
    });
  }
}
