import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { IServiceConfig } from './app.config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private serviceConfig: IServiceConfig) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const { headers } = context.switchToHttp().getRequest();
      const { authorization } = headers;
      if (authorization === `Bearer ${this.serviceConfig.authToken}`) return true;
    } catch (e) {
      throw new UnauthorizedException();
    }

    throw new UnauthorizedException();
  }
}
