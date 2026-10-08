require('dotenv').config();
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL || '';

const isDbConfigured = databaseUrl && databaseUrl !== 'your_supabase_postgresql_connection_string';

let pool = null;
if (isDbConfigured) {
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

const initializeDatabase = async () => {
  if (!isDbConfigured || !pool) return;
  
  const client = await pool.connect();
  try {
    console.log("Initializing database tables if not existed...");
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT CHECK (role IN ('admin', 'project_head', 'team_member')) NOT NULL,
          profile_image TEXT,
          department TEXT,
          designation TEXT,
          joins_date DATE DEFAULT CURRENT_DATE,
          status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
          phone TEXT,
          documents JSONB DEFAULT '[]'::jsonb,
          employment_type TEXT DEFAULT 'on role',
          dob DATE,
          gender TEXT,
          address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);

    try {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'on role';`);
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS dob TEXT;`);
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;`);
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;`);
    } catch (e) {
      console.warn("Could not alter users table:", e);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          company TEXT,
          status TEXT DEFAULT 'initiated',
          follow_up_notes JSONB DEFAULT '[]'::jsonb,
          onboarded_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);

    try {
      await client.query(`ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;`);
      await client.query(`ALTER TABLE clients ADD CONSTRAINT clients_status_check CHECK (status IN ('initiated', 'inprogress', 'budgetary', 'proposal', 'lead', 'onboard', 'onboarded', 'follow_up'));`);
    } catch (e) {
      console.warn("Could not update clients status check constraint:", e);
    }

    try {
      await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_followup_date TEXT;`);
    } catch (e) {
      console.warn("Could not add next_followup_date column:", e);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
          description TEXT,
          status TEXT CHECK (status IN ('planning', 'active', 'completed', 'on_hold')) DEFAULT 'planning',
          start_date DATE,
          end_date DATE,
          budget NUMERIC(15, 2) DEFAULT 0.00,
          project_head_id UUID REFERENCES users(id) ON DELETE SET NULL,
          category TEXT,
          department TEXT,
          priority TEXT DEFAULT 'Medium',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);

    try {
      await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT;`);
      await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS department TEXT;`);
      await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';`);
    } catch (e) {
      console.warn("Could not add category/department/priority columns to projects:", e);
    }


    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
          status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'review')) DEFAULT 'todo',
          start_date DATE,
          end_date DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS deadline_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
          requested_by UUID REFERENCES users(id) ON DELETE CASCADE,
          current_end_date DATE NOT NULL,
          requested_end_date DATE NOT NULL,
          reason TEXT NOT NULL,
          status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
          submitted_by UUID REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          hours_spent NUMERIC(5, 2) DEFAULT 0.00,
          progress INT DEFAULT 0,
          status TEXT CHECK (status IN ('submitted', 'approved')) DEFAULT 'submitted',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);

    try {
      await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;`);
      await client.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;`);
    } catch (e) {
      console.warn("Could not add progress column to tasks/reports:", e);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          action TEXT NOT NULL,
          description TEXT NOT NULL,
          performed_by TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          status TEXT CHECK (status IN ('present', 'absent', 'half_day', 'on_leave', 'holiday')) DEFAULT 'present',
          check_in TEXT,
          check_out TEXT,
          morning_in TEXT,
          morning_out TEXT,
          afternoon_in TEXT,
          afternoon_out TEXT,
          work_mode TEXT CHECK (work_mode IN ('office', 'remote', 'hybrid')) DEFAULT 'office',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          UNIQUE (user_id, date)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leaves (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          leave_type TEXT CHECK (leave_type IN ('casual', 'sick', 'earned', 'unpaid', 'permission', 'half_day', 'emergency')) DEFAULT 'casual',
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          days INT DEFAULT 1,
          reason TEXT NOT NULL,
          status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
          reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);

    // Insert Default Demo Users
    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, department, designation) VALUES
      ('admin@saas.com', 'admin123', 'Rajesh Sharma', 'admin', 'Management', 'CEO'),
      ('head@saas.com', 'head123', 'Vikram Malhotra', 'project_head', 'Engineering', 'VP of Projects'),
      ('member@saas.com', 'member123', 'Aravind Kumar', 'team_member', 'Engineering', 'Senior Developer')
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Database initialization failed:", err);
  } finally {
    client.release();
  }
};

module.exports = { pool, isDbConfigured, initializeDatabase };
