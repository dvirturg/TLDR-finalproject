
import { Request } from 'express';

export interface JwtPayload {
  sub: string;   
  username: string;
}

export interface RegisterBody {
  username: string;
  email: string;
  password: string;
  profileUrl?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}