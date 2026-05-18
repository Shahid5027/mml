"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const admin_controller_1 = require("../controllers/admin.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
// Apply global route protections: only ADMIN role is permitted access
router.use(auth_middleware_1.authenticateJWT);
router.use((0, role_middleware_1.requireRole)(['ADMIN']));
// 1. Onboard a new Employee (POST /api/admin/employees)
router.post('/employees', [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Employee name is required.')
        .trim(),
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Provide a valid corporate email address.')
        .normalizeEmail(),
    (0, express_validator_1.body)('department')
        .notEmpty()
        .withMessage('Department assignment is required.')
        .trim(),
    (0, express_validator_1.body)('shiftStartTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Provide a valid 24h clock format (HH:MM).')
        .optional()
], validate_middleware_1.handleValidationErrors, admin_controller_1.createEmployee);
// 2. Fetch and filter employee directory (GET /api/admin/employees)
router.get('/employees', admin_controller_1.listEmployees);
// 3. Mark attendance entries as invalid & create audit traces (PUT /api/admin/attendance/invalidate)
router.put('/attendance/invalidate', [
    (0, express_validator_1.body)('attendanceId')
        .notEmpty()
        .withMessage('Target attendanceId parameter is required.'),
    (0, express_validator_1.body)('reason')
        .notEmpty()
        .withMessage('Audit correction reason is required.')
        .trim()
], validate_middleware_1.handleValidationErrors, admin_controller_1.invalidateAttendance);
// 4. All employees' today status (GET /api/admin/attendance/today)
router.get('/attendance/today', admin_controller_1.getTodayAttendance);
// 5. Org-wide monthly report (GET /api/admin/attendance/report)
router.get('/attendance/report', [
    (0, express_validator_1.query)('month')
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('Target report month parameter must match the YYYY-MM calendar format.')
], validate_middleware_1.handleValidationErrors, admin_controller_1.getMonthlyReport);
// 6. Security trust insights and anomalies (GET /api/admin/attendance/insights)
router.get('/attendance/insights', admin_controller_1.getAttendanceInsights);
exports.default = router;
