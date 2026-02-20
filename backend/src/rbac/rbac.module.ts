import { Global, Module } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

/**
 * RBAC Module — globally available.
 * RolesGuard can be injected into any module without importing RbacModule explicitly.
 *
 * Usage in any controller:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(Role.ADMIN)
 *   @Get('admin-only')
 *   async adminEndpoint() {}
 */
@Global()
@Module({
    providers: [RolesGuard],
    exports: [RolesGuard],
})
export class RbacModule { }
