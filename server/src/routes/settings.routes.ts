import { Router } from 'express';
import { body } from 'express-validator';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { handleValidationErrors } from '../middleware/validate.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Apply auth gates: user must be logged in to inspect coordinates
router.use(authenticateJWT);

// 1. Fetch active office settings (GET /api/settings)
router.get('/', getSettings);

// 2. Save settings adjustments (PUT /api/settings) - restricted to ADMIN role only
router.put(
  '/',
  requireRole(['ADMIN']),
  [
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Provide a valid latitude coordinate (-90 to 90).'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Provide a valid longitude coordinate (-180 to 180).'),
    body('radiusMeters')
      .isFloat({ min: 10, max: 5000 })
      .withMessage('Provide a valid radius between 10m and 5000m.'),
    body('lateThresholdMinutes')
      .isInt({ min: 0, max: 1440 })
      .withMessage('Provide a valid threshold between 0 and 1440 minutes.')
  ],
  handleValidationErrors,
  updateSettings
);

export default router;
