import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export const requireRole = (allowedRoles: ('ADMIN' | 'EMPLOYEE')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Access unauthorized. Session validation is required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access forbidden. You do not possess the authorization for this transaction.'
      });
    }

    next();
  };
};
