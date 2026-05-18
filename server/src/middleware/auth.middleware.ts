import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'EMPLOYEE';
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Access denied. Authorization token missing or malformed.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'geoshield_super_secure_jwt_secret_key_12345!';
    const decoded = jwt.verify(token, secret) as { id: string; role: 'ADMIN' | 'EMPLOYEE' };
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      message: 'Access forbidden. Active session token is invalid or expired.'
    });
  }
};
