import pool from './database.js';

async function migrate() {
  console.log('🔄 Running employee management schema migrations...');
  try {
    // 1. Add department column to users table if not exists
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Engineering';
    `);
    console.log('✅ Added department column to users table.');

    // 2. Resolve existing status constraints on attendance
    const checkConstraintQuery = `
      SELECT concon.conname 
      FROM pg_constraint concon
      JOIN pg_class c ON concon.conrelid = c.oid
      WHERE c.relname = 'attendance' AND concon.contype = 'c';
    `;
    const res = await pool.query(checkConstraintQuery);
    for (const row of res.rows) {
      if (row.conname.includes('status')) {
        console.log(`Dropping constraint: ${row.conname}`);
        await pool.query(`ALTER TABLE attendance DROP CONSTRAINT IF EXISTS ${row.conname};`);
      }
    }

    // Add updated status check constraint supporting 'INVALID'
    await pool.query(`
      ALTER TABLE attendance 
      ADD CONSTRAINT check_attendance_status 
      CHECK (status IN ('PRESENT', 'LATE', 'WFH', 'ABSENT', 'EXCUSED', 'INVALID'));
    `);
    console.log('✅ Updated attendance status constraints to include WFH, EXCUSED, and INVALID.');

    // 3. Resolve existing event_type constraints on attendance_logs
    const logConstraintQuery = `
      SELECT concon.conname 
      FROM pg_constraint concon
      JOIN pg_class c ON concon.conrelid = c.oid
      WHERE c.relname = 'attendance_logs' AND concon.contype = 'c';
    `;
    const resLogs = await pool.query(logConstraintQuery);
    for (const row of resLogs.rows) {
      if (row.conname.includes('event_type')) {
        console.log(`Dropping constraint: ${row.conname}`);
        await pool.query(`ALTER TABLE attendance_logs DROP CONSTRAINT IF EXISTS ${row.conname};`);
      }
    }

    // Add updated event_type check constraint supporting 'ADMIN_INVALIDATE'
    await pool.query(`
      ALTER TABLE attendance_logs 
      ADD CONSTRAINT check_log_event_type 
      CHECK (event_type IN ('CHECK_IN_SUCCESS', 'CHECK_IN_FAIL', 'CHECK_OUT_SUCCESS', 'CHECK_OUT_FAIL', 'ADMIN_INVALIDATE'));
    `);
    console.log('✅ Updated attendance_logs event_type constraints to include ADMIN_INVALIDATE.');

    // 4. Create trusted_devices table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trusted_devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fingerprint VARCHAR(255) NOT NULL,
        device_name VARCHAR(255) NOT NULL,
        is_trusted BOOLEAN NOT NULL DEFAULT TRUE,
        first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_device UNIQUE (user_id, fingerprint)
      );
    `);
    console.log('✅ Created trusted_devices table.');

    // 5. Create device_alerts table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fingerprint VARCHAR(255) NOT NULL,
        device_name VARCHAR(255) NOT NULL,
        event_type VARCHAR(50) NOT NULL DEFAULT 'NEW_DEVICE_LOGIN',
        details TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created device_alerts table.');

    console.log('🎉 Migrations successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
