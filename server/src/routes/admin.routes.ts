import { Router } from 'express';
import { body, query } from 'express-validator';
import { 
  createEmployee, 
  listEmployees, 
  invalidateAttendance, 
  getTodayAttendance, 
  getMonthlyReport,
  getAttendanceInsights
} from '../controllers/admin.controller';
import { handleValidationErrors } from '../middleware/validate.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Apply global route protections: only ADMIN role is permitted access
router.use(authenticateJWT);
router.use(requireRole(['ADMIN']));

// 1. Onboard a new Employee (POST /api/admin/employees)
router.post(
  '/employees',
  [
    body('name')
      .notEmpty()
      .withMessage('Employee name is required.')
      .trim(),
    body('email')
      .isEmail()
      .withMessage('Provide a valid corporate email address.')
      .normalizeEmail(),
    body('department')
      .notEmpty()
      .withMessage('Department assignment is required.')
      .trim(),
    body('shiftStartTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Provide a valid 24h clock format (HH:MM).')
      .optional()
  ],
  handleValidationErrors,
  createEmployee
);

// 2. Fetch and filter employee directory (GET /api/admin/employees)
router.get('/employees', listEmployees);

// 3. Mark attendance entries as invalid & create audit traces (PUT /api/admin/attendance/invalidate)
router.put(
  '/attendance/invalidate',
  [
    body('attendanceId')
      .notEmpty()
      .withMessage('Target attendanceId parameter is required.'),
    body('reason')
      .notEmpty()
      .withMessage('Audit correction reason is required.')
      .trim()
  ],
  handleValidationErrors,
  invalidateAttendance
);

// 4. All employees' today status (GET /api/admin/attendance/today)
router.get('/attendance/today', getTodayAttendance);

// 5. Org-wide monthly report (GET /api/admin/attendance/report)
router.get(
  '/attendance/report',
  [
    query('month')
      .matches(/^\d{4}-\d{2}$/)
      .withMessage('Target report month parameter must match the YYYY-MM calendar format.')
  ],
  handleValidationErrors,
  getMonthlyReport
);

// 6. Security trust insights and anomalies (GET /api/admin/attendance/insights)
router.get('/attendance/insights', getAttendanceInsights);

export default router;
