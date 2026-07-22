import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignorExpiration: false,
      secretOrKey: process.env.JWT_PRIVATE_KEY || 'dev-secret-key',
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    return { sub: payload.id, username: payload.username };
  }
}
