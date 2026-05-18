import { Router } from 'express';
import { body } from 'express-validator';
import { login, getMe } from '../controllers/auth.controller';
import { handleValidationErrors } from '../middleware/validate.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Login endpoint router with express-validator validation guards
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please supply a valid corporate email address.')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required for verification.')
  ],
  handleValidationErrors,
  login
);

// Get currently logged-in user profile identity details
router.get('/me', authenticateJWT, getMe);

export default router;
