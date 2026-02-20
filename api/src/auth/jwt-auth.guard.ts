import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: unknown, user: unknown): TUser {
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException(
            'Você precisa estar logado para acessar este recurso',
          );
    }

    return user as TUser;
  }
}
