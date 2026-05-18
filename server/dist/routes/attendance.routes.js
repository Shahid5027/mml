"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const attendance_controller_1 = require("../controllers/attendance.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Apply global authentication block to all attendance routes
router.use(auth_middleware_1.authenticateJWT);
// 1. Check-In Punch (POST /api/attendance/check-in)
router.post('/check-in', [
    (0, express_validator_1.body)('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be a valid float value (-90..90).'),
    (0, express_validator_1.body)('longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be a valid float value (-180..180).')
], validate_middleware_1.handleValidationErrors, attendance_controller_1.checkIn);
// 2. Check-Out Punch (POST /api/attendance/check-out)
router.post('/check-out', [
    (0, express_validator_1.body)('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be a valid float value (-90..90).'),
    (0, express_validator_1.body)('longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be a valid float value (-180..180).')
], validate_middleware_1.handleValidationErrors, attendance_controller_1.checkOut);
// 3. Get employee today's status (GET /api/attendance/today)
router.get('/today', attendance_controller_1.getTodayStatus);
// 4. Get employee history ledger (GET /api/attendance/history)
router.get('/history', [
    (0, express_validator_1.query)('month')
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('Audit month parameter must match the YYYY-MM calendar format.')
], validate_middleware_1.handleValidationErrors, attendance_controller_1.getHistory);
exports.default = router;
