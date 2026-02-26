import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() decorator
 *
 * Extracts the authenticated user from the JWT request.
 *
 * @example
 * @Get('me')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return user;
 * }
 *
 * @example with specific field
 * @Get('me/id')
 * getId(@CurrentUser('id') id: string) {
 *   return id;
 * }
 */
export const CurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
