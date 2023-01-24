import { sign, verify } from 'jsonwebtoken';
import { InternalServerError, Unauthorized } from 'http-errors';
import { AuthProps } from 'src/auth/auth.interface';

const accessTokenSecret = 'multialcance';

export function signAccessToken(payload: AuthProps) {
  return new Promise((resolve, reject) => {
    sign({ payload }, accessTokenSecret, {}, (err, token) => {
      if (err) {
        reject(new InternalServerError());
      }
      resolve(token);
    });
  });
}
export function verifyAccessToken(token: string) {
  return new Promise((resolve, reject) => {
    verify(token, accessTokenSecret, (err, payload) => {
      if (err) {
        const message =
          err.name == 'JsonWebTokenError' ? 'Unauthorized' : err.message;
        return reject(new Unauthorized(message));
      }
      resolve(payload);
    });
  });
}
