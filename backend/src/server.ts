import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure a list of allowed origins (supporting both environment-specific production URLs and local hosts)
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

// Enable Cross-Origin Resource Sharing (CORS) with robust, dynamic verification
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server or development requests without origin headers (e.g. Curl or Postman)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some((allowed) => origin === allowed) ||
                        origin.startsWith('http://localhost:') ||
                        origin.endsWith('.vercel.app');
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`⚠️ Blocked by CORS: Origin '${origin}' is not authorized.`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Fingerprint', 'X-Device-Name'],
    credentials: true,
  })
);

// Built-in JSON request parser middleware
app.use(express.json());

// Main entry point for all REST APIs
app.use('/api', apiRouter);

// Base Health Check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global central error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Express server error:', err);
  res.status(500).json({ error: 'An unexpected backend error occurred.' });
});

app.listen(PORT, () => {
  console.log(`🚀 GeoShield AI Server running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/health`);
});
