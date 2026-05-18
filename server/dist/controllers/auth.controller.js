"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../config/prisma");
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // 1. Fetch user by email address
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({
                message: 'Invalid credentials. Please verify your email and password.'
            });
        }
        // 2. Validate password hash match
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid credentials. Please verify your email and password.'
            });
        }
        // 3. Generate Signed JWT token
        const jwtSecret = process.env.JWT_SECRET || 'geoshield_super_secure_jwt_secret_key_12345!';
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            role: user.role
        }, jwtSecret, { expiresIn: '24h' } // 24 hours active session limit
        );
        // 4. Return JWT Token and Sanitized User Object
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                shiftStartTime: user.shiftStartTime
            }
        });
    }
    catch (error) {
        console.error('Login Endpoint Error:', error);
        return res.status(500).json({
            message: 'An internal error occurred during the login process.',
            error: error.message
        });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Session unauthorized.' });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) {
            return res.status(404).json({ message: 'User record not found.' });
        }
        return res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                shiftStartTime: user.shiftStartTime
            }
        });
    }
    catch (error) {
        console.error('GetMe Endpoint Error:', error);
        return res.status(500).json({
            message: 'An internal error occurred while fetching user profile.',
            error: error.message
        });
    }
};
exports.getMe = getMe;
