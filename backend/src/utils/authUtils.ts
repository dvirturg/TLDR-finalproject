import * as jwt from 'jsonwebtoken';

export const generateTokens = (userId: string, username: string) => {
  const accessTokenSecret = process.env.JWT_SECRET;
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessTokenSecret || !refreshTokenSecret) {
    throw new Error("JWT secrets are not defined in environment variables");
  }

  const accessToken = jwt.sign(
    { sub: userId, username },
    accessTokenSecret,
    { expiresIn: '15m' } 
  );

  const refreshToken = jwt.sign(
    { sub: userId },
    refreshTokenSecret,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): any => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }
  
  return jwt.verify(token, secret);
};