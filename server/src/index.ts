import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import settingsRoutes from './routes/settings.routes';
import attendanceRoutes from './routes/attendance.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with dynamic configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Parse incoming JSON payloads
app.use(express.json());

// Basic health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    service: 'GeoShield AI Backend'
  });
});

// Configure registered API routers
app.use('/api/auth', authRoutes);


app.use('/api/attendance', attendanceRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/settings', settingsRoutes);

// 404 Route handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// Global central error handler middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
