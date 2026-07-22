import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: any) => JwtStrategy.extractJwtFromRequest(req),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_PRIVATE_KEY || 'dev-secret-key',
      algorithms: ['HS256'],
    });
  }

  extractJwt(req: any) {
    return JwtStrategy.extractJwtFromRequest(req);
  }

  static extractJwtFromRequest(req: any) {
    const fromAuthHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (fromAuthHeader) {
      return fromAuthHeader;
    }

    const fromHeader =
      req?.headers?.['x-access-token'] ||
      req?.headers?.['x-auth-token'] ||
      req?.headers?.token ||
      req?.headers?.Authorization;

    if (typeof fromHeader === 'string' && fromHeader.trim()) {
      return fromHeader;
    }

    const fromQuery = req?.query?.token;

    if (typeof fromQuery === 'string' && fromQuery.trim()) {
      return fromQuery;
    }

    return null;
  }

  async validate(payload: any) {
    return {
      sub: payload.sub ?? payload.id,
      username: payload.username ?? payload.login,
    };
  }
}
