"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Login endpoint router with express-validator validation guards
router.post('/login', [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please supply a valid corporate email address.')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required for verification.')
], validate_middleware_1.handleValidationErrors, auth_controller_1.login);
// Get currently logged-in user profile identity details
router.get('/me', auth_middleware_1.authenticateJWT, auth_controller_1.getMe);
exports.default = router;
