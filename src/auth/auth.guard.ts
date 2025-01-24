import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public';


import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { jwtConstants } from 'src/constants';

@Injectable()
export class CustomAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService, private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      //Public
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) return true;

      //verify token
      const request = context.switchToHttp().getRequest<Request>();
      const token = this.extractTokenFromHeader(request);
      if (!token) throw new UnauthorizedException('Token not found');

      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: jwtConstants.secret
        }
      );

      //Verify revoked account
      const isRevoked = await this.cacheManager.get(`revoked_token_${token}`);
      if (isRevoked) {
        throw new UnauthorizedException('Token has been revoked');
      }

      //Verify ip
      if (payload.ip !== request.ip) {
        throw new UnauthorizedException('Invalid IP address');
      }


      request['user'] = payload;
      return true;
    }
    catch (e) {
      console.error(e);
      throw new UnauthorizedException('');
    }
  }
  private extractTokenFromHeader(request: Request): string {
    const [type, token] = request.headers.authorization?.split(' ') || [];
    return type == 'Bearer' ? token : '';
  }

}
