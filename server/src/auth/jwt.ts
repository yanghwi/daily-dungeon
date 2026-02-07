import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'round-midnight-dev-secret';
const TOKEN_EXPIRY = '30d';

export interface JwtPayload {
  userId: string;
  displayName: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Express 미들웨어: Authorization 헤더에서 토큰 추출
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token required' });
    return;
  }

  const payload = verifyToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  (req as any).user = payload;
  next();
}

// 선택적 인증: 토큰이 있으면 파싱, 없어도 통과
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    (req as any).user = verifyToken(header.slice(7));
  }
  next();
}
