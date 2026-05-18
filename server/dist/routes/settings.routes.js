"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const settings_controller_1 = require("../controllers/settings.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
// Apply auth gates: user must be logged in to inspect coordinates
router.use(auth_middleware_1.authenticateJWT);
// 1. Fetch active office settings (GET /api/settings)
router.get('/', settings_controller_1.getSettings);
// 2. Save settings adjustments (PUT /api/settings) - restricted to ADMIN role only
router.put('/', (0, role_middleware_1.requireRole)(['ADMIN']), [
    (0, express_validator_1.body)('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Provide a valid latitude coordinate (-90 to 90).'),
    (0, express_validator_1.body)('longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Provide a valid longitude coordinate (-180 to 180).'),
    (0, express_validator_1.body)('radiusMeters')
        .isFloat({ min: 10, max: 5000 })
        .withMessage('Provide a valid radius between 10m and 5000m.'),
    (0, express_validator_1.body)('lateThresholdMinutes')
        .isInt({ min: 0, max: 1440 })
        .withMessage('Provide a valid threshold between 0 and 1440 minutes.')
], validate_middleware_1.handleValidationErrors, settings_controller_1.updateSettings);
exports.default = router;
