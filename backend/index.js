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
let reportsStore = [];
let projectHistoryStore = [
  { id: 'h1', project_id: 'p1', action: 'created', description: 'Project created with initial budget of ₹15,00,000.', performed_by: 'Admin', created_at: new Date().toISOString() }
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

app.post('/api/users', async (req, res) => {
  const { email, password_hash, full_name, role, department, designation, phone, joins_date, status, employment_type, dob, gender, address } = req.body;
  const activeJoinsDate = joins_date || new Date().toISOString().split('T')[0];
  const activeStatus = status || 'active';
  const activeEmpType = employment_type || 'on role';
  const newUser = { id: Math.random().toString(36).substr(2, 9), joins_date: activeJoinsDate, status: activeStatus, employment_type: activeEmpType, dob: dob || null, gender: gender || null, address: address || null, documents: [], ...req.body };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, full_name, role, department, designation, phone, joins_date, status, employment_type, dob, gender, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
        [email, password_hash || 'member123', full_name, role, department, designation, phone, activeJoinsDate, activeStatus, activeEmpType, dob || null, gender || null, address || null]
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
  const { name, client_id, description, start_date, end_date, budget, project_head_id, performed_by } = req.body;
  const newProject = { id: 'p' + (projectsStore.length + 1), status: 'planning', ...req.body };

  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO projects (name, client_id, description, start_date, end_date, budget, project_head_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [name, client_id, description, start_date, end_date, budget, project_head_id]
      );
      const createdProj = result.rows[0];
      const performedByVal = performed_by || 'System';
      await pool.query(
        'INSERT INTO project_history (project_id, action, description, performed_by) VALUES ($1, $2, $3, $4)',
        [createdProj.id, 'created', `Project created with initial budget of ₹${budget || 0}.`, performedByVal]
      );
      // Notify the assigned project head
      if (project_head_id) {
        await createNotification(
          project_head_id,
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
  if (project_head_id) {
    createNotification(
      project_head_id,
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
      const fields = [];
      const values = [];
      let paramIndex = 1;
      for (const [key, value] of Object.entries(req.body)) {
        if (['name', 'client_id', 'description', 'start_date', 'end_date', 'budget', 'project_head_id', 'status'].includes(key)) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
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
            `You have been assigned as Project Head for project: "${updated.name}"`
          );
        }
      }

      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // In-memory fallback
  const prev = projectsStore.find(p => p.id === id);
  projectsStore = projectsStore.map(p => p.id === id ? { ...p, ...req.body } : p);
  const updated = projectsStore.find(p => p.id === id);

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
  const newTask = { id: 't' + (tasksStore.length + 1), status: 'todo', ...req.body };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO tasks (project_id, title, description, assigned_to, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [project_id, title, description, assigned_to, start_date, end_date]
      );
      const insertedTask = result.rows[0];
      if (assigned_to) {
        await createNotification(assigned_to, 'New Task Assigned', `You have been assigned a new task: "${title}"`);
      }
      return res.json(insertedTask);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  tasksStore.push(newTask);
  if (assigned_to) {
    createNotification(assigned_to, 'New Task Assigned', `You have been assigned a new task: "${title}"`);
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

      const keys = Object.keys(fields).filter(k => fields[k] !== undefined);
      if (keys.length > 0) {
        const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
        const values = keys.map(key => fields[key]);
        values.push(id);

        const query = `UPDATE tasks SET ${setClause} WHERE id = $${values.length} RETURNING *`;
        const result = await pool.query(query, values);
        if (result.rows.length > 0) {
          const updatedTask = result.rows[0];

          // Notify newly assigned member if assignee changed
          if (
            fields.assigned_to &&
            prevTask &&
            String(fields.assigned_to) !== String(prevTask.assigned_to)
          ) {
            await createNotification(
              fields.assigned_to,
              'New Task Assigned',
              `You have been assigned a new task: "${updatedTask.title}"`
            );
          }

          // Notify assignee when task is marked completed
          if (fields.status === 'completed' && updatedTask.assigned_to) {
            await createNotification(
              updatedTask.assigned_to,
              'Task Completed & Signed Off',
              `Your task "${updatedTask.title}" has been signed off and completed.`
            );
          }

          // Always sync memory store too
          tasksStore = tasksStore.map(t => String(t.id) === String(id) ? { ...t, ...fields } : t);
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
  const newReq = { id: 'dr' + (deadlineRequestsStore.length + 1), status: 'pending', ...req.body };
  
  if (isDbConfigured && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO deadline_requests (task_id, requested_by, current_end_date, requested_end_date, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [task_id, requested_by, current_end_date, requested_end_date, reason]
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

app.put('/api/notifications/user/:userId/read-all', async (req, res) => {
  const { userId } = req.params;
  const memoryAction = () => {
    notificationsStore.forEach(n => {
      if (String(n.user_id) === String(userId)) n.is_read = true;
    });
    return { success: true };
  };
  try {
    if (isDbConfigured && pool) {
      await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
      res.json({ success: true });
    } else {
      res.json(memoryAction());
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
