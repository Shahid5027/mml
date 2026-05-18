import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';

// Detect if we are connecting to a remote host (e.g. Render) to automatically enable SSL
const isRemoteDb = process.env.DATABASE_URL && 
  !process.env.DATABASE_URL.includes('localhost') && 
  !process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: (isProduction || isRemoteDb) ? { rejectUnauthorized: false } : undefined,
      }
    : {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'geoshield_db',
      }
);

// Verify database connection pool health
pool.on('connect', () => {
  console.log('⚡ PostgreSQL pool successfully connected to database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database pool connection error', err);
});

export default pool;
