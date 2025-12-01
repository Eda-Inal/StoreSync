import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserPayload } from '../types/user-payload.type';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
