require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, isDbConfigured, initializeDatabase } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
let reportsStore = [
  { id: 'rep1', task_id: 't1', submitted_by: '3', content: 'Completed design tokens and typography calibration', hours_spent: 6.5, progress: 40, status: 'submitted', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'rep2', task_id: 't1', submitted_by: '3', content: 'Integrated modal popups and responsive grid', hours_spent: 7.0, progress: 75, status: 'approved', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'rep3', task_id: 't1', submitted_by: '3', content: 'Fixing contrast and high-priority QA bugs', hours_spent: 5.5, progress: 90, status: 'submitted', created_at: new Date().toISOString() }
];
let projectHistoryStore = [
  { id: 'h1', project_id: 'p1', action: 'created', description: 'Project created with initial budget of ₹15,00,000.', performed_by: 'Admin', created_at: new Date().toISOString() }
];

let attendanceStore = [
  { id: 'att1', user_id: '3', date: new Date().toISOString().split('T')[0], status: 'present', check_in: '09:15 AM', check_out: '06:30 PM', work_mode: 'office', notes: 'Sprint development' },
  { id: 'att2', user_id: '3', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], status: 'present', check_in: '09:05 AM', check_out: '06:45 PM', work_mode: 'office', notes: 'Completed deliverables' },
  { id: 'att3', user_id: '3', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], status: 'present', check_in: '09:30 AM', check_out: '06:15 PM', work_mode: 'remote', notes: 'Work from home' },
  { id: 'att4', user_id: '2', date: new Date().toISOString().split('T')[0], status: 'present', check_in: '09:00 AM', check_out: '06:00 PM', work_mode: 'office', notes: 'Sprint review' },
  { id: 'att5', user_id: '2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], status: 'present', check_in: '09:10 AM', check_out: '06:10 PM', work_mode: 'office', notes: 'Architectural planning' },
  { id: 'att6', user_id: '1', date: new Date().toISOString().split('T')[0], status: 'present', check_in: '08:50 AM', check_out: '07:00 PM', work_mode: 'office', notes: 'Executive board meetings' }
];

let leavesStore = [
  { id: 'lev1', user_id: '3', leave_type: 'casual', start_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], end_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], days: 2, reason: 'Family engagement', status: 'pending', reviewed_by: null, created_at: new Date().toISOString() },
  { id: 'lev2', user_id: '2', leave_type: 'sick', start_date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0], end_date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0], days: 1, reason: 'Viral fever recovery', status: 'approved', reviewed_by: '1', created_at: new Date(Date.now() - 86400000 * 8).toISOString() }
];

let notificationsStore = [];

const createNotification = async (userId, title, message) => {
  if (!userId) return;
  if (isDbConfigured && pool) {
    try {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, is_read) VALUES ($1, $2, $3, FALSE)',
        [userId, title, message]
      );
    } catch (e) {
      console.error("Failed to insert database notification, storing in memory:", e);
      notificationsStore.push({
        id: Math.random().toString(36).substring(2, 9),
        user_id: userId,
        title,
        message,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }
  } else {
    notificationsStore.push({
      id: Math.random().toString(36).substring(2, 9),
      user_id: userId,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    });
  }
};

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

app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const data = await executeQuery(
    'SELECT * FROM users WHERE id = $1',
    [id],
    () => usersStore.filter(u => u.id === id)
  );
  if (data && data.length > 0) {
    res.json(data[0]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/users', async (req, res) => {
  const { email, password_hash, full_name, role, department, designation, phone, joins_date, status, employment_type, dob, gender, address, documents } = req.body;
  const activeJoinsDate = joins_date || new Date().toISOString().split('T')[0];
  const activeStatus = status || 'active';
  const activeEmpType = employment_type || 'on role';
  const newUser = { id: Math.random().toString(36).substr(2, 9), joins_date: activeJoinsDate, status: activeStatus, employment_type: activeEmpType, dob: dob || null, gender: gender || null, address: address || null, documents: documents || [], ...req.body };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, full_name, role, department, designation, phone, joins_date, status, employment_type, dob, gender, address, documents) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
        [email, password_hash || 'member123', full_name, role, department, designation, phone, activeJoinsDate, activeStatus, activeEmpType, dob || null, gender || null, address || null, JSON.stringify(documents || [])]
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
  const { full_name, email, password_hash, role, department, designation, phone, joins_date, status, employment_type, dob, gender, address, documents } = req.body;
  
  if (isDbConfigured && pool) {
    try {
      const currentResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (currentResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const current = currentResult.rows[0];

      const result = await pool.query(
        'UPDATE users SET full_name = $1, email = $2, password_hash = $3, role = $4, department = $5, designation = $6, phone = $7, joins_date = $8, status = $9, employment_type = $10, dob = $11, gender = $12, address = $13, documents = $14 WHERE id = $15 RETURNING *',
        [
          full_name !== undefined ? full_name : current.full_name,
          email !== undefined ? email : current.email,
          password_hash !== undefined && password_hash !== '' ? password_hash : current.password_hash,
          role !== undefined ? role : current.role,
          department !== undefined ? department : current.department,
          designation !== undefined ? designation : current.designation,
          phone !== undefined ? phone : current.phone,
          joins_date !== undefined ? joins_date : current.joins_date,
          status !== undefined ? status : current.status,
          employment_type !== undefined ? employment_type : current.employment_type,
          dob !== undefined ? dob : current.dob,
          gender !== undefined ? gender : current.gender,
          address !== undefined ? address : current.address,
          documents !== undefined ? JSON.stringify(documents) : JSON.stringify(current.documents || []),
          id
        ]
      );
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  usersStore = usersStore.map(u => u.id === id ? { ...u, ...req.body } : u);
  res.json(usersStore.find(u => u.id === id));
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  if (isDbConfigured && pool) {
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  usersStore = usersStore.filter(u => u.id !== id);
  res.json({ success: true });
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
  const { name, email, phone, company, status, follow_up_notes, onboarded_at, next_followup_date } = req.body;
  
  if (isDbConfigured && pool) {
    try {
      const currentRes = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
      if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
      const current = currentRes.rows[0];

      const result = await pool.query(
        'UPDATE clients SET name = $1, email = $2, phone = $3, company = $4, status = $5, follow_up_notes = $6, onboarded_at = $7, next_followup_date = $8 WHERE id = $9 RETURNING *',
        [
          name !== undefined ? name : current.name,
          email !== undefined ? email : current.email,
          phone !== undefined ? phone : current.phone,
          company !== undefined ? company : current.company,
          status !== undefined ? status : current.status,
          follow_up_notes !== undefined ? JSON.stringify(follow_up_notes) : JSON.stringify(current.follow_up_notes || []),
          onboarded_at !== undefined ? onboarded_at : current.onboarded_at,
          next_followup_date !== undefined ? next_followup_date : current.next_followup_date,
          id
        ]
      );
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  clientsStore = clientsStore.map(c => c.id === id ? { ...c, ...req.body } : c);
  res.json(clientsStore.find(c => c.id === id));
});

app.delete('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  if (isDbConfigured && pool) {
    try {
      await pool.query('DELETE FROM clients WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  clientsStore = clientsStore.filter(c => c.id !== id);
  res.json({ success: true });
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
        ORDER BY p.created_at DESC
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

app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(`
        SELECT p.*, 
        row_to_json(c) as client, 
        row_to_json(u) as project_head 
        FROM projects p 
        LEFT JOIN clients c ON p.client_id = c.id 
        LEFT JOIN users u ON p.project_head_id = u.id
        WHERE p.id = $1
      `, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
      return res.json(result.rows[0]);
    } catch (err) {
      console.warn("Project database query failed, falling back to memory:", err);
    }
  }

  const p = projectsStore.find(proj => String(proj.id) === String(id));
  if (!p) return res.status(404).json({ error: 'Project not found' });
  const mapped = {
    ...p,
    client: clientsStore.find(c => c.id === p.client_id),
    project_head: usersStore.find(u => u.id === p.project_head_id)
  };
  res.json(mapped);
});

app.post('/api/projects', async (req, res) => {
  const { name, client_id, description, start_date, end_date, budget, project_head_id, category, department, priority, status, performed_by } = req.body;
  const cleanClientId = client_id ? client_id : null;
  const cleanProjectHeadId = project_head_id ? project_head_id : null;
  const cleanStartDate = start_date ? start_date : null;
  const cleanEndDate = end_date ? end_date : null;
  const cleanBudget = budget ? Number(budget) : 0;
  const cleanStatus = status || 'planning';
  const cleanPriority = priority || 'Medium';

  const newProject = { 
    id: 'p' + (projectsStore.length + 1), 
    name,
    client_id: cleanClientId,
    description: description || null,
    start_date: cleanStartDate,
    end_date: cleanEndDate,
    budget: cleanBudget,
    project_head_id: cleanProjectHeadId,
    category: category || null,
    department: department || null,
    priority: cleanPriority,
    status: cleanStatus,
    created_at: new Date().toISOString()
  };

  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO projects (name, client_id, description, start_date, end_date, budget, project_head_id, category, department, priority, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [name, cleanClientId, description || null, cleanStartDate, cleanEndDate, cleanBudget, cleanProjectHeadId, category || null, department || null, cleanPriority, cleanStatus]
      );
      const createdProj = result.rows[0];
      const performedByVal = performed_by || 'System';
      await pool.query(
        'INSERT INTO project_history (project_id, action, description, performed_by) VALUES ($1, $2, $3, $4)',
        [createdProj.id, 'created', `Project created with initial budget of ₹${budget || 0}.`, performedByVal]
      );
      // Notify the assigned project head
      if (cleanProjectHeadId) {
        await createNotification(
          cleanProjectHeadId,
          'New Project Assigned to You',
          `You have been assigned as Project Head for the new project: "${name}"`
        );
      }
      return res.json(createdProj);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // In-memory fallback
  projectsStore.push(newProject);
  const performedByVal = performed_by || 'System';
  projectHistoryStore.push({
    id: 'h' + (projectHistoryStore.length + 1),
    project_id: newProject.id,
    action: 'created',
    description: `Project created with initial budget of ₹${newProject.budget || 0}.`,
    performed_by: performedByVal,
    created_at: new Date().toISOString()
  });
  // Notify the assigned project head (in-memory)
  if (cleanProjectHeadId) {
    createNotification(
      cleanProjectHeadId,
      'New Project Assigned to You',
      `You have been assigned as Project Head for the new project: "${name}"`
    );
  }
  res.json(newProject);
});

app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const performedBy = req.body.performed_by || 'System';

  if (isDbConfigured && pool) {
    try {
      // 1. Get existing project to compare
      const prevResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
      const prev = prevResult.rows[0];

      // 2. Build dynamic update query
      const allowedFields = ['name', 'client_id', 'description', 'start_date', 'end_date', 'budget', 'project_head_id', 'status', 'category', 'department', 'priority'];
      const fields = [];
      const values = [];
      let paramIndex = 1;
      for (const [key, value] of Object.entries(req.body)) {
        if (allowedFields.includes(key)) {
          let sanitizedVal = value;
          if (['client_id', 'project_head_id', 'start_date', 'end_date'].includes(key) && (value === '' || value === undefined)) {
            sanitizedVal = null;
          }
          if (key === 'budget' && value !== undefined && value !== null) {
            sanitizedVal = Number(value);
          }
          fields.push(`"${key}" = $${paramIndex}`);
          values.push(sanitizedVal);
          paramIndex++;
        }
      }
      if (fields.length > 0) {
        values.push(id);
        const queryText = `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await pool.query(queryText, values);
        const updated = result.rows[0];

        // 3. Log history & send notifications
        if (prev) {
          if (req.body.status && prev.status !== req.body.status) {
            await pool.query(
              'INSERT INTO project_history (project_id, action, description, performed_by) VALUES ($1, $2, $3, $4)',
              [id, 'status_changed', `Status updated from ${prev.status} to ${req.body.status}.`, performedBy]
            );
          }
          if (req.body.budget && Number(prev.budget) !== Number(req.body.budget)) {
            await pool.query(
              'INSERT INTO project_history (project_id, action, description, performed_by) VALUES ($1, $2, $3, $4)',
              [id, 'budget_updated', `Budget updated from ₹${prev.budget} to ₹${req.body.budget}.`, performedBy]
            );
          }
          // Notify new project head if assigned/changed
          if (
            req.body.project_head_id &&
            String(req.body.project_head_id) !== String(prev.project_head_id)
          ) {
            await createNotification(
              req.body.project_head_id,
              'Project Assigned to You',
              `You have been assigned as Project Head for project: "${updated?.name || prev.name}"`
            );
          }
        }

        return res.json(updated);
      }
      return res.json(prev);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // In-memory fallback
  const prev = projectsStore.find(p => String(p.id) === String(id));
  projectsStore = projectsStore.map(p => String(p.id) === String(id) ? { ...p, ...req.body } : p);
  const updated = projectsStore.find(p => String(p.id) === String(id));

  if (prev) {
    if (req.body.status && prev.status !== req.body.status) {
      projectHistoryStore.push({
        id: 'h' + (projectHistoryStore.length + 1),
        project_id: id,
        action: 'status_changed',
        description: `Status updated from ${prev.status} to ${req.body.status}.`,
        performed_by: performedBy,
        created_at: new Date().toISOString()
      });
    }
    if (req.body.budget && Number(prev.budget) !== Number(req.body.budget)) {
      projectHistoryStore.push({
        id: 'h' + (projectHistoryStore.length + 1),
        project_id: id,
        action: 'budget_updated',
        description: `Budget updated from ₹${prev.budget} to ₹${req.body.budget}.`,
        performed_by: performedBy,
        created_at: new Date().toISOString()
      });
    }
    // Notify new project head (in-memory)
    if (
      req.body.project_head_id &&
      String(req.body.project_head_id) !== String(prev.project_head_id)
    ) {
      createNotification(
        req.body.project_head_id,
        'Project Assigned to You',
        `You have been assigned as Project Head for project: "${updated.name}"`
      );
    }
  }

  res.json(updated);
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  if (isDbConfigured && pool) {
    try {
      await pool.query('DELETE FROM projects WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  projectsStore = projectsStore.filter(p => p.id !== id);
  res.json({ success: true });
});

app.get('/api/projects/:id/history', async (req, res) => {
  const { id } = req.params;
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query('SELECT * FROM project_history WHERE project_id = $1 ORDER BY created_at DESC', [id]);
      return res.json(result.rows);
    } catch (err) {
      console.warn("Project history query failed, falling back to memory:", err);
    }
  }
  const filtered = projectHistoryStore
    .filter(h => h.project_id === id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(filtered);
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
  const cleanProjectId = project_id ? project_id : null;
  const cleanAssignedTo = assigned_to ? assigned_to : null;
  const cleanStartDate = start_date ? start_date : null;
  const cleanEndDate = end_date ? end_date : null;

  const newTask = { 
    id: 't' + (tasksStore.length + 1), 
    status: 'todo', 
    ...req.body,
    project_id: cleanProjectId,
    assigned_to: cleanAssignedTo,
    start_date: cleanStartDate,
    end_date: cleanEndDate
  };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO tasks (project_id, title, description, assigned_to, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [cleanProjectId, title, description, cleanAssignedTo, cleanStartDate, cleanEndDate]
      );
      const insertedTask = result.rows[0];
      if (cleanAssignedTo) {
        await createNotification(cleanAssignedTo, 'New Task Assigned', `You have been assigned a new task: "${title}"`);
      }
      return res.json(insertedTask);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  tasksStore.push(newTask);
  if (cleanAssignedTo) {
    createNotification(cleanAssignedTo, 'New Task Assigned', `You have been assigned a new task: "${title}"`);
  }
  res.json(newTask);
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  if (isDbConfigured && pool) {
    try {
      // Fetch previous state to detect reassignment or completion
      const prevResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
      const prevTask = prevResult.rows[0];

      const sanitizedFields = { ...fields };
      if ('assigned_to' in sanitizedFields && (sanitizedFields.assigned_to === '' || sanitizedFields.assigned_to === undefined)) {
        sanitizedFields.assigned_to = null;
      }
      if ('start_date' in sanitizedFields && (sanitizedFields.start_date === '' || sanitizedFields.start_date === undefined)) {
        sanitizedFields.start_date = null;
      }
      if ('end_date' in sanitizedFields && (sanitizedFields.end_date === '' || sanitizedFields.end_date === undefined)) {
        sanitizedFields.end_date = null;
      }
      if ('progress' in sanitizedFields && sanitizedFields.progress !== undefined && sanitizedFields.progress !== null) {
        sanitizedFields.progress = Number(sanitizedFields.progress);
      }

      const keys = Object.keys(sanitizedFields).filter(k => sanitizedFields[k] !== undefined);
      if (keys.length > 0) {
        const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
        const values = keys.map(key => sanitizedFields[key]);
        values.push(id);

        const query = `UPDATE tasks SET ${setClause} WHERE id = $${values.length} RETURNING *`;
        const result = await pool.query(query, values);
        if (result.rows.length > 0) {
          const updatedTask = result.rows[0];

          // Notify newly assigned member if assignee changed
          if (
            sanitizedFields.assigned_to &&
            prevTask &&
            String(sanitizedFields.assigned_to) !== String(prevTask.assigned_to)
          ) {
            await createNotification(
              sanitizedFields.assigned_to,
              'New Task Assigned',
              `You have been assigned a new task: "${updatedTask.title}"`
            );
          }

          // Notify assignee when task is marked completed
          if (sanitizedFields.status === 'completed' && updatedTask.assigned_to) {
            await createNotification(
              updatedTask.assigned_to,
              'Task Completed & Signed Off',
              `Your task "${updatedTask.title}" has been signed off and completed.`
            );
          }

          // Always sync memory store too
          tasksStore = tasksStore.map(t => String(t.id) === String(id) ? { ...t, ...sanitizedFields } : t);
          return res.json(updatedTask);
        }
      }
    } catch (err) {
      console.warn('Tasks DB update error (using memory fallback):', err.message);
    }
  }

  // In-memory fallback
  const prevMem = tasksStore.find(t => String(t.id) === String(id));
  tasksStore = tasksStore.map(t => String(t.id) === String(id) ? { ...t, ...fields } : t);
  const updated = tasksStore.find(t => String(t.id) === String(id)) || { id, ...fields };

  // Notify newly assigned member (in-memory)
  if (
    fields.assigned_to &&
    prevMem &&
    String(fields.assigned_to) !== String(prevMem.assigned_to)
  ) {
    createNotification(
      fields.assigned_to,
      'New Task Assigned',
      `You have been assigned a new task: "${updated.title}"`
    );
  }

  // Notify assignee when task completed (in-memory)
  if (fields.status === 'completed' && updated.assigned_to) {
    createNotification(
      updated.assigned_to,
      'Task Completed & Signed Off',
      `Your task "${updated.title}" has been signed off and completed.`
    );
  }

  res.json(updated);
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  if (isDbConfigured && pool) {
    try {
      await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  tasksStore = tasksStore.filter(t => t.id !== id);
  res.json({ success: true });
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
  const cleanCurrentEndDate = current_end_date ? current_end_date : null;
  const cleanRequestedEndDate = requested_end_date ? requested_end_date : null;
  const newReq = { id: 'dr' + (deadlineRequestsStore.length + 1), status: 'pending', ...req.body, current_end_date: cleanCurrentEndDate, requested_end_date: cleanRequestedEndDate };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO deadline_requests (task_id, requested_by, current_end_date, requested_end_date, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [task_id, requested_by, cleanCurrentEndDate, cleanRequestedEndDate, reason]
      );
      const inserted = result.rows[0];
      
      // Get project head to notify
      const projectHeadQuery = await pool.query(
        'SELECT p.project_head_id, t.title, u.full_name FROM tasks t JOIN projects p ON t.project_id = p.id JOIN users u ON u.id = $2 WHERE t.id = $1',
        [task_id, requested_by]
      );
      if (projectHeadQuery.rows.length > 0) {
        const { project_head_id, title, full_name } = projectHeadQuery.rows[0];
        if (project_head_id) {
          await createNotification(project_head_id, 'Deadline Extension Request', `${full_name} has requested an extension for task: "${title}"`);
        }
      }
      return res.json(inserted);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  
  deadlineRequestsStore.push(newReq);
  const task = tasksStore.find(t => t.id === task_id);
  const project = projectsStore.find(p => p.id === task?.project_id);
  const user = usersStore.find(u => u.id === requested_by);
  if (project?.project_head_id) {
    createNotification(project.project_head_id, 'Deadline Extension Request', `${user?.full_name || 'A team member'} has requested an extension for task: "${task?.title || 'Task'}"`);
  }
  res.json(newReq);
});

app.put('/api/deadline-requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query('UPDATE deadline_requests SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      const updated = result.rows[0];
      
      // Get requester & task info to notify
      const infoQuery = await pool.query(
        'SELECT d.requested_by, t.title FROM deadline_requests d JOIN tasks t ON d.task_id = t.id WHERE d.id = $1',
        [id]
      );
      if (infoQuery.rows.length > 0) {
        const { requested_by, title } = infoQuery.rows[0];
        await createNotification(requested_by, `Deadline Request ${status.toUpperCase()}`, `Your extension request for task "${title}" has been ${status}.`);
      }
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  deadlineRequestsStore = deadlineRequestsStore.map(d => d.id === id ? { ...d, ...req.body } : d);
  const updatedMem = deadlineRequestsStore.find(d => d.id === id);
  const taskMem = tasksStore.find(t => t.id === updatedMem?.task_id);
  if (updatedMem?.requested_by) {
    createNotification(updatedMem.requested_by, `Deadline Request ${status.toUpperCase()}`, `Your extension request for task "${taskMem?.title || 'Task'}" has been ${status}.`);
  }
  res.json(updatedMem);
});

// Reports API
app.get('/api/reports', async (req, res) => {
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(`
        SELECT r.*, 
        row_to_json(u) as user,
        json_build_object(
          'id', t.id,
          'title', t.title,
          'description', t.description,
          'status', t.status,
          'progress', t.progress,
          'project_id', t.project_id,
          'project', row_to_json(p)
        ) as task
        FROM reports r 
        LEFT JOIN tasks t ON r.task_id = t.id 
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON r.submitted_by = u.id
        ORDER BY r.created_at DESC
      `);
      return res.json(result.rows);
    } catch (err) {
      console.warn("Reports db query failed:", err);
    }
  }

  const mapped = reportsStore.map(r => {
    const taskObj = tasksStore.find(t => t.id === r.task_id);
    const projectObj = taskObj ? projectsStore.find(p => p.id === taskObj.project_id) : null;
    return {
      ...r,
      task: taskObj ? { ...taskObj, project: projectObj } : null,
      user: usersStore.find(u => u.id === r.submitted_by)
    };
  }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  res.json(mapped);
});

app.post('/api/reports', async (req, res) => {
  const { task_id, submitted_by, content, hours_spent, progress } = req.body;
  const newReport = { 
    id: 'rep' + (reportsStore.length + 1), 
    task_id,
    submitted_by: submitted_by || null,
    content: content || '',
    hours_spent: Number(hours_spent || 0),
    progress: Number(progress || 0),
    status: 'submitted',
    created_at: new Date().toISOString()
  };
  
  reportsStore.push(newReport);
  
  // Sync matching task in memory
  tasksStore = tasksStore.map(t => String(t.id) === String(task_id) ? { ...t, progress: Number(progress || 0) } : t);

  // Trigger in-memory notification
  const taskMem = tasksStore.find(t => t.id === task_id);
  const projectMem = projectsStore.find(p => p.id === taskMem?.project_id);
  const userMem = usersStore.find(u => u.id === submitted_by);
  if (projectMem?.project_head_id) {
    createNotification(projectMem.project_head_id, 'New Task Update Submitted', `${userMem?.full_name || 'A team member'} submitted a progress report (${progress}%) for task: "${taskMem?.title || 'Task'}"`);
  }

  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO reports (task_id, submitted_by, content, hours_spent, progress) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [task_id, submitted_by || null, content, hours_spent || 0, progress || 0]
      );
      if (progress !== undefined && progress !== null) {
        await pool.query('UPDATE tasks SET progress = $1 WHERE id = $2', [Number(progress || 0), task_id]);
      }
      if (result.rows.length > 0) {
        const inserted = result.rows[0];
        // Get project head to notify
        const projectHeadQuery = await pool.query(
          'SELECT p.project_head_id, t.title, u.full_name FROM tasks t JOIN projects p ON t.project_id = p.id JOIN users u ON u.id = $2 WHERE t.id = $1',
          [task_id, submitted_by]
        );
        if (projectHeadQuery.rows.length > 0) {
          const { project_head_id, title, full_name } = projectHeadQuery.rows[0];
          if (project_head_id) {
            await createNotification(project_head_id, 'New Task Update Submitted', `${full_name} submitted a progress report (${progress}%) for task: "${title}"`);
          }
        }
        return res.json(inserted);
      }
    } catch (err) {
      console.warn("Reports DB insert warning (using memory fallback):", err.message);
    }
  }
  
  res.json(newReport);
});

app.put('/api/reports/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query('UPDATE reports SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
      const updated = result.rows[0];
      
      // Get report requester & task info to notify
      const infoQuery = await pool.query(
        'SELECT r.submitted_by, r.progress, t.title FROM reports r JOIN tasks t ON r.task_id = t.id WHERE r.id = $1',
        [id]
      );
      if (infoQuery.rows.length > 0) {
        const { submitted_by, progress, title } = infoQuery.rows[0];
        if (submitted_by) {
          await createNotification(submitted_by, 'Task Update Approved', `Your progress report of ${progress}% on task "${title}" has been approved / acknowledged.`);
        }
      }
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  reportsStore = reportsStore.map(r => r.id === id ? { ...r, ...req.body } : r);
  const updatedMem = reportsStore.find(r => r.id === id);
  const taskMem = tasksStore.find(t => t.id === updatedMem?.task_id);
  if (updatedMem?.submitted_by) {
    createNotification(updatedMem.submitted_by, 'Task Update Approved', `Your progress report of ${updatedMem.progress}% on task "${taskMem?.title || 'Task'}" has been approved / acknowledged.`);
  }
  res.json(updatedMem);
});

// Notifications API
app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  const memoryAction = () => {
    return notificationsStore.filter(n => String(n.user_id) === String(userId));
  };
  try {
    const notifications = await executeQuery(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
      memoryAction
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  const memoryAction = () => {
    const notif = notificationsStore.find(n => String(n.id) === String(id));
    if (notif) notif.is_read = true;
    return { success: true };
  };
  try {
    if (isDbConfigured && pool) {
      await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
      res.json({ success: true });
    } else {
      res.json(memoryAction());
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ATTENDANCE & LEAVES & TIMESHEET APIS
// ==========================================

// 1. Get Attendance Records
app.get('/api/attendance', async (req, res) => {
  const { date, user_id, month } = req.query;
  const memoryAction = () => {
    let list = attendanceStore.map(a => ({
      ...a,
      user: usersStore.find(u => String(u.id) === String(a.user_id))
    }));
    if (date) list = list.filter(a => a.date === date);
    if (user_id) list = list.filter(a => String(a.user_id) === String(user_id));
    if (month) list = list.filter(a => a.date && a.date.startsWith(month));
    return list;
  };

  if (isDbConfigured && pool) {
    try {
      let query = `
        SELECT a.*, row_to_json(u) as user 
        FROM attendance a 
        LEFT JOIN users u ON a.user_id = u.id 
        WHERE 1=1
      `;
      const params = [];
      if (date) {
        params.push(date);
        query += ` AND a.date = $${params.length}`;
      }
      if (user_id) {
        params.push(user_id);
        query += ` AND a.user_id = $${params.length}`;
      }
      if (month) {
        params.push(`${month}%`);
        query += ` AND a.date::text LIKE $${params.length}`;
      }
      query += ` ORDER BY a.date DESC`;
      const result = await pool.query(query, params);
      return res.json(result.rows);
    } catch (err) {
      console.warn("Database query for attendance failed, falling back to memory:", err);
    }
  }
  res.json(memoryAction());
});

// 2. Mark / Update Attendance
app.post('/api/attendance', async (req, res) => {
  const { 
    user_id, 
    date, 
    status, 
    check_in, 
    check_out, 
    morning_in, 
    morning_out, 
    afternoon_in, 
    afternoon_out, 
    work_mode, 
    notes 
  } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const targetStatus = status || 'present';
  const targetMode = work_mode || 'office';

  if (isDbConfigured && pool) {
    try {
      // Ensure columns exist if table was already created without them
      await pool.query(`
        ALTER TABLE attendance 
        ADD COLUMN IF NOT EXISTS morning_in TEXT,
        ADD COLUMN IF NOT EXISTS morning_out TEXT,
        ADD COLUMN IF NOT EXISTS afternoon_in TEXT,
        ADD COLUMN IF NOT EXISTS afternoon_out TEXT;
      `).catch(() => {});

      const result = await pool.query(`
        INSERT INTO attendance (user_id, date, status, check_in, check_out, morning_in, morning_out, afternoon_in, afternoon_out, work_mode, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id, date) DO UPDATE 
        SET status = EXCLUDED.status, 
            check_in = COALESCE(EXCLUDED.check_in, attendance.check_in), 
            check_out = COALESCE(EXCLUDED.check_out, attendance.check_out),
            morning_in = COALESCE(EXCLUDED.morning_in, attendance.morning_in),
            morning_out = COALESCE(EXCLUDED.morning_out, attendance.morning_out),
            afternoon_in = COALESCE(EXCLUDED.afternoon_in, attendance.afternoon_in),
            afternoon_out = COALESCE(EXCLUDED.afternoon_out, attendance.afternoon_out),
            work_mode = EXCLUDED.work_mode,
            notes = EXCLUDED.notes
        RETURNING *
      `, [
        user_id, 
        targetDate, 
        targetStatus, 
        check_in || null, 
        check_out || null, 
        morning_in || null, 
        morning_out || null, 
        afternoon_in || null, 
        afternoon_out || null, 
        targetMode, 
        notes || ''
      ]);
      return res.json(result.rows[0]);
    } catch (err) {
      console.warn("DB insert attendance failed, falling back to memory:", err);
    }
  }

  const existingIdx = attendanceStore.findIndex(a => String(a.user_id) === String(user_id) && a.date === targetDate);
  if (existingIdx !== -1) {
    attendanceStore[existingIdx] = {
      ...attendanceStore[existingIdx],
      status: targetStatus,
      check_in: check_in || attendanceStore[existingIdx].check_in,
      check_out: check_out || attendanceStore[existingIdx].check_out,
      morning_in: morning_in !== undefined ? morning_in : attendanceStore[existingIdx].morning_in,
      morning_out: morning_out !== undefined ? morning_out : attendanceStore[existingIdx].morning_out,
      afternoon_in: afternoon_in !== undefined ? afternoon_in : attendanceStore[existingIdx].afternoon_in,
      afternoon_out: afternoon_out !== undefined ? afternoon_out : attendanceStore[existingIdx].afternoon_out,
      work_mode: targetMode,
      notes: notes !== undefined ? notes : attendanceStore[existingIdx].notes
    };
    return res.json(attendanceStore[existingIdx]);
  } else {
    const newRecord = {
      id: 'att' + (attendanceStore.length + 1),
      user_id,
      date: targetDate,
      status: targetStatus,
      check_in: check_in || morning_in || '09:00 AM',
      check_out: check_out || afternoon_out || null,
      morning_in: morning_in || check_in || '09:00 AM',
      morning_out: morning_out || null,
      afternoon_in: afternoon_in || null,
      afternoon_out: afternoon_out || null,
      work_mode: targetMode,
      notes: notes || ''
    };
    attendanceStore.push(newRecord);
    return res.json(newRecord);
  }
});

// 3. Get Leave Requests
app.get('/api/leaves', async (req, res) => {
  const { user_id, status } = req.query;
  const memoryAction = () => {
    let list = leavesStore.map(l => ({
      ...l,
      user: usersStore.find(u => String(u.id) === String(l.user_id)),
      reviewer: usersStore.find(u => String(u.id) === String(l.reviewed_by))
    }));
    if (user_id) list = list.filter(l => String(l.user_id) === String(user_id));
    if (status) list = list.filter(l => l.status === status);
    return list;
  };

  if (isDbConfigured && pool) {
    try {
      let query = `
        SELECT l.*, 
          row_to_json(u) as user,
          row_to_json(rev) as reviewer 
        FROM leaves l 
        LEFT JOIN users u ON l.user_id = u.id 
        LEFT JOIN users rev ON l.reviewed_by = rev.id
        WHERE 1=1
      `;
      const params = [];
      if (user_id) {
        params.push(user_id);
        query += ` AND l.user_id = $${params.length}`;
      }
      if (status) {
        params.push(status);
        query += ` AND l.status = $${params.length}`;
      }
      query += ` ORDER BY l.created_at DESC`;
      const result = await pool.query(query, params);
      return res.json(result.rows);
    } catch (err) {
      console.warn("Database query for leaves failed, falling back to memory:", err);
    }
  }
  res.json(memoryAction());
});

// 4. Submit Leave Request
app.post('/api/leaves', async (req, res) => {
  const { user_id, leave_type, start_date, end_date, days, reason } = req.body;
  const numDays = Number(days || 1);

  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(`
        INSERT INTO leaves (user_id, leave_type, start_date, end_date, days, reason, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *
      `, [user_id, leave_type || 'casual', start_date, end_date, numDays, reason]);
      
      const adminUsers = await pool.query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of adminUsers.rows) {
        await createNotification(admin.id, 'New Leave / Permission Application', `An employee requested ${numDays} day(s) of ${leave_type || 'casual'} leave / permission.`);
      }

      return res.json(result.rows[0]);
    } catch (err) {
      console.warn("DB insert leave failed, falling back to memory:", err);
    }
  }

  const newLeave = {
    id: 'lev' + (leavesStore.length + 1),
    user_id,
    leave_type: leave_type || 'casual',
    start_date,
    end_date,
    days: numDays,
    reason,
    status: 'pending',
    reviewed_by: null,
    created_at: new Date().toISOString()
  };
  leavesStore.unshift(newLeave);

  // Notify admins
  const admins = usersStore.filter(u => u.role === 'admin');
  admins.forEach(admin => {
    createNotification(admin.id, 'New Leave / Permission Application', `An employee requested ${numDays} day(s) of ${leave_type || 'casual'} leave / permission.`);
  });

  res.json(newLeave);
});

// 5. Approve / Reject Leave Request
app.put('/api/leaves/:id', async (req, res) => {
  const { id } = req.params;
  const { status, reviewed_by, remarks } = req.body;

  if (isDbConfigured && pool) {
    try {
      // Ensure remarks column exists
      try {
        await pool.query(`ALTER TABLE leaves ADD COLUMN IF NOT EXISTS remarks TEXT;`);
      } catch (e) {
        // Ignore if exists
      }

      const result = await pool.query(`
        UPDATE leaves 
        SET status = $1, reviewed_by = $2, remarks = $3 
        WHERE id = $4 RETURNING *
      `, [status, reviewed_by || null, remarks || null, id]);
      if (result.rows.length > 0) {
        const leave = result.rows[0];
        const remarksMsg = remarks ? ` Remarks: "${remarks}"` : '';
        const formatLeaveDate = (d) => {
          if (!d) return '';
          try {
            const raw = typeof d === 'string' ? d : new Date(d).toISOString().split('T')[0];
            const clean = raw.includes('T') ? raw.split('T')[0] : raw;
            const parts = clean.split('-');
            if (parts.length === 3 && parts[0].length === 4) {
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return clean;
          } catch {
            return String(d).split('T')[0];
          }
        };
        const displayDate = formatLeaveDate(leave.start_date);
        await createNotification(
          leave.user_id, 
          `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`, 
          `Your leave/permission request for ${displayDate} was ${status}.${remarksMsg}`
        );
        return res.json(leave);
      }
    } catch (err) {
      console.warn("DB update leave failed, falling back to memory:", err);
    }
  }

  const idx = leavesStore.findIndex(l => String(l.id) === String(id));
  if (idx !== -1) {
    leavesStore[idx] = { 
      ...leavesStore[idx], 
      status, 
      reviewed_by: reviewed_by || null,
      remarks: remarks || null
    };
    const remarksMsg = remarks ? ` Remarks: "${remarks}"` : '';
    const formatLeaveDate = (d) => {
      if (!d) return '';
      try {
        const raw = typeof d === 'string' ? d : new Date(d).toISOString().split('T')[0];
        const clean = raw.includes('T') ? raw.split('T')[0] : raw;
        const parts = clean.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return clean;
      } catch {
        return String(d).split('T')[0];
      }
    };
    const displayDate = formatLeaveDate(leavesStore[idx].start_date);
    createNotification(
      leavesStore[idx].user_id, 
      `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`, 
      `Your leave/permission request for ${displayDate} was ${status}.${remarksMsg}`
    );
    return res.json(leavesStore[idx]);
  }
  res.status(404).json({ error: 'Leave request not found' });
});

// 6. Aggregated Weekly / Monthly Timesheet View
app.get('/api/timesheets/summary', async (req, res) => {
  // Aggregate hours_spent logged from reports + attendance statuses for all employees
  let reports = [];
  let users = [];

  if (isDbConfigured && pool) {
    try {
      const rResult = await pool.query(`
        SELECT r.*, row_to_json(t) as task 
        FROM reports r 
        LEFT JOIN tasks t ON r.task_id = t.id
      `);
      reports = rResult.rows;
      const uResult = await pool.query(`SELECT id, full_name, email, department, designation, role, profile_image FROM users WHERE status = 'active'`);
      users = uResult.rows;
    } catch (err) {
      console.warn("DB timesheet aggregation query failed, falling back to memory:", err);
      reports = reportsStore;
      users = usersStore;
    }
  } else {
    reports = reportsStore.map(r => ({
      ...r,
      task: tasksStore.find(t => t.id === r.task_id)
    }));
    users = usersStore;
  }

  // Calculate per-employee stats
  const summary = users.map(user => {
    const userReports = reports.filter(r => String(r.submitted_by) === String(user.id));
    const totalHours = userReports.reduce((sum, r) => sum + Number(r.hours_spent || 0), 0);
    const completedTasksCount = userReports.filter(r => Number(r.progress || 0) === 100).length;
    const userAttendance = attendanceStore.filter(a => String(a.user_id) === String(user.id));
    const daysPresent = userAttendance.filter(a => a.status === 'present').length;
    const userLeaves = leavesStore.filter(l => String(l.user_id) === String(user.id) && l.status === 'approved');
    const daysOnLeave = userLeaves.reduce((sum, l) => sum + Number(l.days || 1), 0);

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        department: user.department,
        designation: user.designation,
        role: user.role
      },
      total_hours_logged: totalHours,
      reports_count: userReports.length,
      completed_tasks_count: completedTasksCount,
      days_present: daysPresent,
      days_on_leave: daysOnLeave,
      recent_reports: userReports.slice(-5)
    };
  });

  res.json(summary);
});

// Status check API
app.get('/api/status', (req, res) => {
  res.json({
    dbConnected: isDbConfigured,
    mode: isDbConfigured ? 'Production Supabase PostgreSQL' : 'In-Memory Fallback Sandbox'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Supabase connection status: ${isDbConfigured ? 'CONNECTED' : 'DISCONNECTED (In-memory fallback enabled)'}`);
  if (isDbConfigured) {
    await initializeDatabase();
  }
});
