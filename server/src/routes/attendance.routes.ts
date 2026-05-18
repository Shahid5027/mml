import { Router } from 'express';
import { body, query } from 'express-validator';
import { checkIn, checkOut, getTodayStatus, getHistory } from '../controllers/attendance.controller';
import { handleValidationErrors } from '../middleware/validate.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Apply global authentication block to all attendance routes
router.use(authenticateJWT);

// 1. Check-In Punch (POST /api/attendance/check-in)
router.post(
  '/check-in',
  [
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be a valid float value (-90..90).'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be a valid float value (-180..180).')
  ],
  handleValidationErrors,
  checkIn
);

// 2. Check-Out Punch (POST /api/attendance/check-out)
router.post(
  '/check-out',
  [
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be a valid float value (-90..90).'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be a valid float value (-180..180).')
  ],
  handleValidationErrors,
  checkOut
);

// 3. Get employee today's status (GET /api/attendance/today)
router.get('/today', getTodayStatus);

// 4. Get employee history ledger (GET /api/attendance/history)
router.get(
  '/history',
  [
    query('month')
      .matches(/^\d{4}-\d{2}$/)
      .withMessage('Audit month parameter must match the YYYY-MM calendar format.')
  ],
  handleValidationErrors,
  getHistory
);

export default router;
