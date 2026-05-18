import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed for incoming request parameters.',
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : '',
        message: err.msg
      }))
    });
  }
  
  next();
};
