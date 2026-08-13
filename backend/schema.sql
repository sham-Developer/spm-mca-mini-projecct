-- SQL Schema for SaaS Project & HR Management Application

-- 1. Users Table (Admin, Project Head, Team Member)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- in production, hash this. Or we can match plain text for simple setups
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'project_head', 'team_member')) NOT NULL,
    profile_image TEXT,
    department TEXT,
    designation TEXT,
    joins_date DATE DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    phone TEXT,
    documents JSONB DEFAULT '[]'::jsonb, -- e.g., [{"name": "Aadhar.pdf", "url": "..."}]
    employment_type TEXT DEFAULT 'on role',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Clients Table (Admin Lead/Onboard management)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    status TEXT CHECK (status IN ('lead', 'follow_up', 'onboarded')) DEFAULT 'lead',
    follow_up_notes JSONB DEFAULT '[]'::jsonb, -- e.g., [{"date": "2026-08-11", "note": "Wants pricing quote"}]
    onboarded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    description TEXT,
    status TEXT CHECK (status IN ('planning', 'active', 'completed', 'on_hold')) DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    budget NUMERIC(15, 2) DEFAULT 0.00, -- Indian Rupees format handled in front-end
    project_head_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'review')) DEFAULT 'todo',
    progress INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Deadline Change Requests (Team members request date changes)
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

-- 6. Reports Table (Submitted for task progression)
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

-- 7. Project History Table (Logs auditing status, updates, allocations, etc.)
CREATE TABLE IF NOT EXISTS project_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert Demo Users
-- (Password hash is plaintext for simple auth demo if user wants, or we check matching)
INSERT INTO users (email, password_hash, full_name, role, department, designation) VALUES
('admin@saas.com', 'admin123', 'Rajesh Sharma', 'admin', 'Management', 'CEO'),
('head@saas.com', 'head123', 'Vikram Malhotra', 'project_head', 'Engineering', 'VP of Projects'),
('member@saas.com', 'member123', 'Aravind Kumar', 'team_member', 'Engineering', 'Senior Developer')
ON CONFLICT (email) DO NOTHING;
