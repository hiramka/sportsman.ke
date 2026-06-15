import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    const request = context.switchToHttp().getRequest();
    
    // 1. Read token from HTTP-only Cookie
    let token = null;
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
        const [key, value] = cookie.split('=').map(c => c.trim());
        if (key && value) acc[key] = value;
        return acc;
      }, {});
      token = cookies['sm_token'];
    }

    // 2. Fallback to Authorization Header
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token missing or invalid.');
    }

    try {
      const decoded = this.jwtService.verify(token);
      request.user = decoded; // Attach user claims to request object

      // If route has role requirements, check if user's role satisfies them
      if (requiredRoles && requiredRoles.length > 0) {
        return requiredRoles.includes(decoded.role);
      }

      return true;
    } catch (err) {
      throw new UnauthorizedException('Authentication token signature verification failed.');
    }
  }
}
