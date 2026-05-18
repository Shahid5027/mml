"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceInsights = exports.getMonthlyReport = exports.getTodayAttendance = exports.invalidateAttendance = exports.listEmployees = exports.createEmployee = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
// 1. Create a new Employee/Staff account (Admin Only)
const createEmployee = async (req, res) => {
    const { name, email, password, role, department, shiftStartTime } = req.body;
    try {
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                message: 'Registration failed. Email address is already active.'
            });
        }
        const defaultPassword = password || 'Password123';
        const passwordHash = await bcryptjs_1.default.hash(defaultPassword, 12);
        const newUser = await prisma_1.prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: (role === 'ADMIN' ? client_1.Role.ADMIN : client_1.Role.EMPLOYEE),
                department,
                shiftStartTime: shiftStartTime || '09:00'
            }
        });
        return res.status(201).json({
            message: 'Onboarding completed successfully!',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                department: newUser.department,
                shiftStartTime: newUser.shiftStartTime
            }
        });
    }
    catch (error) {
        console.error('CreateEmployee Endpoint Error:', error);
        return res.status(500).json({
            message: 'An internal error occurred while registering employee account.',
            error: error.message
        });
    }
};
exports.createEmployee = createEmployee;
// 2. Fetch and filter all corporate employees (Admin Only)
const listEmployees = async (req, res) => {
    const { search, department, role } = req.query;
    try {
        const filters = {};
        if (search && typeof search === 'string') {
            filters.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (department && typeof department === 'string') {
            filters.department = department;
        }
        if (role && (role === 'ADMIN' || role === 'EMPLOYEE')) {
            filters.role = role;
        }
        const employees = await prisma_1.prisma.user.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                shiftStartTime: true,
                createdAt: true
            }
        });
        return res.status(200).json(employees);
    }
    catch (error) {
        console.error('ListEmployees Endpoint Error:', error);
        return res.status(500).json({
            message: 'An internal error occurred while compiling staff roster.',
            error: error.message
        });
    }
};
exports.listEmployees = listEmployees;
// 3. Mark attendance entries as invalid & maintain audit logs (Admin Only)
const invalidateAttendance = async (req, res) => {
    const { attendanceId, reason } = req.body;
    const adminId = req.user.id;
    if (!attendanceId || !reason) {
        return res.status(400).json({
            message: 'Parameter mismatch. Supply both attendanceId and reason parameters.'
        });
    }
    try {
        const targetAttendance = await prisma_1.prisma.attendance.findUnique({
            where: { id: attendanceId },
            include: { user: true }
        });
        if (!targetAttendance) {
            return res.status(404).json({
                message: 'Attendance record not found.'
            });
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const updated = await tx.attendance.update({
                where: { id: attendanceId },
                data: { status: 'INVALID' }
            });
            await tx.attendanceLog.create({
                data: {
                    userId: targetAttendance.userId,
                    eventType: 'CHECK_IN',
                    lat: targetAttendance.checkInLat,
                    lng: targetAttendance.checkInLng,
                    distanceFromOffice: 0.0,
                    accepted: false,
                    reason: `INVALIDATED BY ADMIN ID: ${adminId}. Reason: ${reason}`
                }
            });
            return updated;
        });
        return res.status(200).json({
            message: 'Attendance record flagged as invalid. Audit log successfully recorded.',
            record: result
        });
    }
    catch (error) {
        console.error('InvalidateAttendance Endpoint Error:', error);
        return res.status(500).json({
            message: 'An internal error occurred while executing database corrections.',
            error: error.message
        });
    }
};
exports.invalidateAttendance = invalidateAttendance;
// 4. Fetch All Employees' today status (GET /api/admin/attendance/today)
const getTodayAttendance = async (req, res) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);
    try {
        // 1. Fetch all users in DB
        const users = await prisma_1.prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                shiftStartTime: true
            }
        });
        // 2. Fetch all check-ins logged today
        const attendances = await prisma_1.prisma.attendance.findMany({
            where: {
                date: todayDate
            }
        });
        // 3. Map together to compile a live present/absent status roster
        const roster = users.map(user => {
            const punch = attendances.find(a => a.userId === user.id) || null;
            return {
                user,
                punch,
                status: punch ? punch.status : 'ABSENT'
            };
        });
        // Calculate quick aggregates
        const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
        const lateCount = attendances.filter(a => a.status === 'LATE').length;
        const invalidCount = attendances.filter(a => a.status === 'INVALID').length;
        const absentCount = users.length - attendances.length;
        return res.status(200).json({
            roster,
            aggregates: {
                totalStaff: users.length,
                present: presentCount + lateCount,
                late: lateCount,
                absent: absentCount,
                invalid: invalidCount
            }
        });
    }
    catch (error) {
        console.error('GetTodayAttendance Endpoint Error:', error);
        return res.status(500).json({
            message: 'An internal error occurred compiling daily dashboard stats.',
            error: error.message
        });
    }
};
exports.getTodayAttendance = getTodayAttendance;
// 5. Compiles Org-wide monthly report (GET /api/admin/attendance/report)
const getMonthlyReport = async (req, res) => {
    const { month } = req.query; // Format: YYYY-MM
    try {
        if (!month || typeof month !== 'string') {
            return res.status(400).json({
                message: 'Parameter mismatch. Supply a valid YYYY-MM month parameter.'
            });
        }
        const [year, monthStr] = month.split('-').map(Number);
        const startDate = new Date(year, monthStr - 1, 1);
        const endDate = new Date(year, monthStr, 1);
        // Fetch users and their historical logs within target range
        const users = await prisma_1.prisma.user.findMany({
            where: { role: 'EMPLOYEE' },
            include: {
                attendances: {
                    where: {
                        date: {
                            gte: startDate,
                            lt: endDate
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        // Formulate reports row by row
        const report = users.map(user => {
            const totalPunches = user.attendances.length;
            const validPunches = user.attendances.filter(a => a.status !== 'INVALID');
            const latePunches = user.attendances.filter(a => a.status === 'LATE');
            const presentCount = validPunches.length;
            const sumHours = validPunches.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);
            const averageHours = presentCount > 0 ? parseFloat((sumHours / presentCount).toFixed(1)) : 0.0;
            // Attendance percentage out of standard 22-day working month
            const attendancePercentage = Math.round((presentCount / 22) * 100);
            return {
                userId: user.id,
                name: user.name,
                email: user.email,
                department: user.department || 'Operations',
                shiftStartTime: user.shiftStartTime,
                daysPresent: presentCount,
                daysLate: latePunches.length,
                daysAbsent: Math.max(0, 22 - presentCount),
                totalHours: parseFloat(sumHours.toFixed(1)),
                averageHours,
                attendancePercentage: Math.min(100, attendancePercentage)
            };
        });
        return res.status(200).json(report);
    }
    catch (error) {
        console.error('GetMonthlyReport Endpoint Error:', error);
        return res.status(500).json({
            message: 'An internal error occurred compiling monthly reports.',
            error: error.message
        });
    }
};
exports.getMonthlyReport = getMonthlyReport;
// 6. Fetch Attendance Security & Geofence Confidence Insights (GET /api/admin/attendance/insights)
const getAttendanceInsights = async (req, res) => {
    try {
        // 1. Fetch recent raw logs (failed/succeeded checkins)
        const logs = await prisma_1.prisma.attendanceLog.findMany({
            take: 15,
            orderBy: { timestamp: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true, department: true }
                }
            }
        });
        // 2. Fetch all employees
        const employees = await prisma_1.prisma.user.findMany({
            where: { role: 'EMPLOYEE' },
            select: {
                id: true,
                name: true,
                email: true,
                department: true,
                shiftStartTime: true
            }
        });
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDate = new Date(todayStr);
        // 3. Compile or gather insights per employee
        const insights = await Promise.all(employees.map(async (emp) => {
            const userLogs = await prisma_1.prisma.attendanceLog.findMany({
                where: { userId: emp.id }
            });
            const failedAttempts = userLogs.filter(l => !l.accepted).length;
            // Dynamic confidence scoring
            let score = 98;
            let unusualLocation = false;
            let unusualTiming = false;
            let analysisDetails = "Normal pattern, geofence matches center benchmark.";
            if (failedAttempts >= 3) {
                score = 43;
                unusualLocation = true;
                analysisDetails = `Suspicious pattern: ${failedAttempts} repeated check-in attempts rejected outside bounds.`;
            }
            else if (failedAttempts > 0) {
                score = 74;
                unusualLocation = true;
                analysisDetails = `Unusual location pattern: ${failedAttempts} attempt rejected out-of-bounds.`;
            }
            else {
                // Check if any checkin today was late
                const todayAtt = await prisma_1.prisma.attendance.findFirst({
                    where: { userId: emp.id, date: todayDate }
                });
                if (todayAtt && todayAtt.isLate) {
                    score = 88;
                    unusualTiming = true;
                    analysisDetails = "Timing anomaly: Checked in after late-buffer threshold.";
                }
            }
            return {
                id: emp.id,
                userId: emp.id,
                name: emp.name,
                email: emp.email,
                department: emp.department || 'Operations',
                confidenceScore: score,
                unusualLocation,
                unusualTiming,
                failedAttemptsCount: failedAttempts,
                analysisDetails
            };
        }));
        return res.status(200).json({
            insights,
            recentLogs: logs
        });
    }
    catch (error) {
        console.error('GetAttendanceInsights Endpoint Error:', error);
        return res.status(500).json({
            message: 'An internal error occurred compiling trust insights.',
            error: error.message
        });
    }
};
exports.getAttendanceInsights = getAttendanceInsights;
