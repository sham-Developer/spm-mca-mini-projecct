require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, isDbConfigured, initializeDatabase } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// IN-MEMORY DATABASE FALLBACK (For visual demonstrations if connection string isn't provided yet)
let usersStore = [
  { id: '1', email: 'admin@saas.com', password_hash: 'admin123', full_name: 'Rajesh Sharma', role: 'admin', department: 'Executive', designation: 'Managing Director', joins_date: '2025-01-10', status: 'active', phone: '9876543210', documents: [{ name: 'Offer_Letter.pdf' }] },
  { id: '2', email: 'head@saas.com', password_hash: 'head123', full_name: 'Vikram Malhotra', role: 'project_head', department: 'Engineering', designation: 'Technical Architect', joins_date: '2025-03-15', status: 'active', phone: '9876543211', documents: [] },
  { id: '3', email: 'member@saas.com', password_hash: 'member123', full_name: 'Aravind Kumar', role: 'team_member', department: 'Engineering', designation: 'Senior Developer', joins_date: '2025-06-01', status: 'active', phone: '9876543212', documents: [] }
];

let clientsStore = [
  { id: 'c1', name: 'Rohan Gupta', email: 'rohan@apexcorp.com', phone: '9123456780', company: 'Apex Corp', status: 'onboarded', follow_up_notes: [{ date: '2026-08-10', note: 'Agreed on initial specifications.' }], onboarded_at: '2026-08-10T12:00:00Z' },
  { id: 'c2', name: 'Priya Patel', email: 'priya@zenith.in', phone: '9123456781', company: 'Zenith Retail', status: 'follow_up', follow_up_notes: [{ date: '2026-08-08', note: 'Sent proposal, waiting on budget feedback.' }], onboarded_at: null }
];

let projectsStore = [
  { id: 'p1', name: 'Apex Dashboard Refactoring', client_id: 'c1', description: 'Redesigning the primary admin dashboard interface for Apex Corp using dynamic charts.', status: 'active', start_date: '2026-08-01', end_date: '2026-10-30', budget: 1500000.00, project_head_id: '2' }
];

let tasksStore = [
  { id: 't1', project_id: 'p1', title: 'Setup Tailwind CSS System', description: 'Configure custom themes, colors, and layout guidelines based on instructions.', assigned_to: '3', status: 'in_progress', start_date: '2026-08-05', end_date: '2026-08-20' }
];

let deadlineRequestsStore = [];
let reportsStore = [];

// Helper db wrapper to route requests
const executeQuery = async (queryText, params, memoryAction) => {
  if (isDbConfigured && pool) {
    try {
      const res = await pool.query(queryText, params);
      return res.rows;
    } catch (e) {
      console.warn("Database query failed, falling back to memory sandbox:", e);
      return memoryAction();
    }
  }
  return memoryAction();
};

// -- ROUTES --

// Auth API
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password_hash = $2', [email, password]);
      if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
      return res.json({ user: result.rows[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    const user = usersStore.find(u => u.email === email && u.password_hash === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ user });
  }
});

// Users / HR Management API
app.get('/api/users', async (req, res) => {
  const data = await executeQuery(
    'SELECT * FROM users ORDER BY created_at DESC',
    [],
    () => usersStore
  );
  res.json(data);
});

app.post('/api/users', async (req, res) => {
  const { email, password_hash, full_name, role, department, designation, phone } = req.body;
  const newUser = { id: Math.random().toString(36).substr(2, 9), joins_date: new Date().toISOString().split('T')[0], status: 'active', documents: [], ...req.body };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, full_name, role, department, designation, phone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [email, password_hash || 'member123', full_name, role, department, designation, phone]
      );
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  usersStore.push(newUser);
  res.json(newUser);
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { documents } = req.body;
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'UPDATE users SET documents = $1 WHERE id = $2 RETURNING *',
        [JSON.stringify(documents), id]
      );
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  usersStore = usersStore.map(u => u.id === id ? { ...u, ...req.body } : u);
  res.json(usersStore.find(u => u.id === id));
});

// Clients API
app.get('/api/clients', async (req, res) => {
  const data = await executeQuery(
    'SELECT * FROM clients ORDER BY created_at DESC',
    [],
    () => clientsStore
  );
  res.json(data);
});

app.post('/api/clients', async (req, res) => {
  const { name, email, phone, company, status } = req.body;
  const newClient = { id: 'c' + (clientsStore.length + 1), follow_up_notes: [], status: 'lead', ...req.body };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO clients (name, email, phone, company, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, email, phone, company, status || 'lead']
      );
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  clientsStore.push(newClient);
  res.json(newClient);
});

app.put('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  const { follow_up_notes, status, onboarded_at } = req.body;
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'UPDATE clients SET follow_up_notes = $1, status = $2, onboarded_at = $3 WHERE id = $4 RETURNING *',
        [JSON.stringify(follow_up_notes), status, onboarded_at, id]
      );
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  clientsStore = clientsStore.map(c => c.id === id ? { ...c, ...req.body } : c);
  res.json(clientsStore.find(c => c.id === id));
});

// Projects API
app.get('/api/projects', async (req, res) => {
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(`
        SELECT p.*, 
        row_to_json(c) as client, 
        row_to_json(u) as project_head 
        FROM projects p 
        LEFT JOIN clients c ON p.client_id = c.id 
        LEFT JOIN users u ON p.project_head_id = u.id
      `);
      return res.json(result.rows);
    } catch (err) {
      console.warn("Projects database query failed, falling back to memory:", err);
    }
  }
  
  const mapped = projectsStore.map(p => ({
    ...p,
    client: clientsStore.find(c => c.id === p.client_id),
    project_head: usersStore.find(u => u.id === p.project_head_id)
  }));
  res.json(mapped);
});

app.post('/api/projects', async (req, res) => {
  const { name, client_id, description, start_date, end_date, budget, project_head_id } = req.body;
  const newProject = { id: 'p' + (projectsStore.length + 1), status: 'planning', ...req.body };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO projects (name, client_id, description, start_date, end_date, budget, project_head_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [name, client_id, description, start_date, end_date, budget, project_head_id]
      );
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  projectsStore.push(newProject);
  res.json(newProject);
});

app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query('UPDATE projects SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  projectsStore = projectsStore.map(p => p.id === id ? { ...p, ...req.body } : p);
  res.json(projectsStore.find(p => p.id === id));
});

// Tasks API
app.get('/api/tasks', async (req, res) => {
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(`
        SELECT t.*, 
        row_to_json(p) as project, 
        row_to_json(u) as assigned_user 
        FROM tasks t 
        LEFT JOIN projects p ON t.project_id = p.id 
        LEFT JOIN users u ON t.assigned_to = u.id
      `);
      return res.json(result.rows);
    } catch (err) {
      console.warn("Tasks db query failed, using memory:", err);
    }
  }

  const mapped = tasksStore.map(t => ({
    ...t,
    project: projectsStore.find(p => p.id === t.project_id),
    assigned_user: usersStore.find(u => u.id === t.assigned_to)
  }));
  res.json(mapped);
});

app.post('/api/tasks', async (req, res) => {
  const { project_id, title, description, assigned_to, start_date, end_date } = req.body;
  const newTask = { id: 't' + (tasksStore.length + 1), status: 'todo', ...req.body };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO tasks (project_id, title, description, assigned_to, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [project_id, title, description, assigned_to, start_date, end_date]
      );
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  tasksStore.push(newTask);
  res.json(newTask);
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { status, end_date } = req.body;
  
  if (isDbConfigured && pool) {
    try {
      let result;
      if (status && end_date) {
        result = await pool.query('UPDATE tasks SET status = $1, end_date = $2 WHERE id = $3 RETURNING *', [status, end_date, id]);
      } else if (status) {
        result = await pool.query('UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      } else {
        result = await pool.query('UPDATE tasks SET end_date = $1 WHERE id = $2 RETURNING *', [end_date, id]);
      }
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  tasksStore = tasksStore.map(t => t.id === id ? { ...t, ...req.body } : t);
  res.json(tasksStore.find(t => t.id === id));
});

// Deadline Requests API
app.get('/api/deadline-requests', async (req, res) => {
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(`
        SELECT d.*, 
        row_to_json(t) as task, 
        row_to_json(u) as requester 
        FROM deadline_requests d 
        LEFT JOIN tasks t ON d.task_id = t.id 
        LEFT JOIN users u ON d.requested_by = u.id
      `);
      return res.json(result.rows);
    } catch (err) {
      console.warn("Requests db failed, using memory:", err);
    }
  }

  const mapped = deadlineRequestsStore.map(d => ({
    ...d,
    task: tasksStore.find(t => t.id === d.task_id),
    requester: usersStore.find(u => u.id === d.requested_by)
  }));
  res.json(mapped);
});

app.post('/api/deadline-requests', async (req, res) => {
  const { task_id, requested_by, current_end_date, requested_end_date, reason } = req.body;
  const newReq = { id: 'dr' + (deadlineRequestsStore.length + 1), status: 'pending', ...req.body };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO deadline_requests (task_id, requested_by, current_end_date, requested_end_date, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [task_id, requested_by, current_end_date, requested_end_date, reason]
      );
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  deadlineRequestsStore.push(newReq);
  res.json(newReq);
});

app.put('/api/deadline-requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query('UPDATE deadline_requests SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  deadlineRequestsStore = deadlineRequestsStore.map(d => d.id === id ? { ...d, ...req.body } : d);
  res.json(deadlineRequestsStore.find(d => d.id === id));
});

// Reports API
app.get('/api/reports', async (req, res) => {
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(`
        SELECT r.*, 
        row_to_json(t) as task, 
        row_to_json(u) as user 
        FROM reports r 
        LEFT JOIN tasks t ON r.task_id = t.id 
        LEFT JOIN users u ON r.submitted_by = u.id
      `);
      return res.json(result.rows);
    } catch (err) {
      console.warn("Reports db query failed:", err);
    }
  }

  const mapped = reportsStore.map(r => ({
    ...r,
    task: tasksStore.find(t => t.id === r.task_id),
    user: usersStore.find(u => u.id === r.submitted_by)
  }));
  res.json(mapped);
});

app.post('/api/reports', async (req, res) => {
  const { task_id, submitted_by, content, hours_spent } = req.body;
  const newReport = { id: 'rep' + (reportsStore.length + 1), status: 'submitted', ...req.body };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO reports (task_id, submitted_by, content, hours_spent) VALUES ($1, $2, $3, $4) RETURNING *',
        [task_id, submitted_by, content, hours_spent]
      );
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  reportsStore.push(newReport);
  res.json(newReport);
});

app.put('/api/reports/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query('UPDATE reports SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  reportsStore = reportsStore.map(r => r.id === id ? { ...r, ...req.body } : r);
  res.json(reportsStore.find(r => r.id === id));
});

// Status check API
app.get('/api/status', (req, res) => {
  res.json({
    dbConnected: isDbConfigured,
    mode: isDbConfigured ? 'Production Supabase PostgreSQL' : 'In-Memory Fallback Sandbox'
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Supabase connection status: ${isDbConfigured ? 'CONNECTED' : 'DISCONNECTED (In-memory fallback enabled)'}`);
  if (isDbConfigured) {
    await initializeDatabase();
  }
});
