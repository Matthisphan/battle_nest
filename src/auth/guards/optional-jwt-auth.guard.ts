import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = unknown>(err: unknown, user: TUser) {
    if (err) {
      return null;
    }

    return user ?? null;
  }

  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
