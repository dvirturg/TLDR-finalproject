import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/auth';

export const generateToken = (userId: string, username: string): string => {
  const secret: jwt.Secret = process.env.JWT_SECRET as string;
  
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const payload: JwtPayload = {
    sub: userId,
    username: username,
  };

  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '1h',
  };

  return jwt.sign(payload, secret, options);
};