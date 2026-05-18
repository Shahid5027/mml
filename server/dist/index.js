"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const attendance_routes_1 = __importDefault(require("./routes/attendance.routes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS with dynamic configuration
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
// Parse incoming JSON payloads
app.use(express_1.default.json());
// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date(),
        service: 'GeoShield AI Backend'
    });
});
// Configure registered API routers
app.use('/api/auth', auth_routes_1.default);
app.use('/api/attendance', attendance_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
// 404 Route handler
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});
// Global central error handler middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        message: 'An unexpected server error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Bootstrap Server listener
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🟢 GeoShield AI Backend is operational!`);
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`🚀 CORS Active for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    console.log(`===============================================`);
});
