import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { extractAccessTokenFromCookie } from './auth-cookie';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // Antes caía silenciosamente em 'dev-secret-key' quando JWT_PRIVATE_KEY
    // não estava definido — qualquer um que soubesse essa string fixa
    // conseguia forjar um token válido. Falha explícita no boot em vez de
    // rodar com um segredo previsível.
    const jwtSecret = process.env.JWT_PRIVATE_KEY;

    if (!jwtSecret) {
      throw new Error(
        'JWT_PRIVATE_KEY não configurado — obrigatório para verificar tokens.',
      );
    }

    super({
      jwtFromRequest: (req: any) => JwtStrategy.extractJwtFromRequest(req),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
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

    // Item 10: fallback pro cookie HttpOnly (ver auth-cookie.ts) — só é
    // efetivamente usado quando o front migrar pra parar de mandar
    // Authorization manualmente; até lá, o header sempre bate primeiro.
    return extractAccessTokenFromCookie(req);
  }

  async validate(payload: any) {
    return {
      sub: payload.sub ?? payload.id,
      username: payload.username ?? payload.login,
    };
  }
}
