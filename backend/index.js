require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const { randomUUID } = require('crypto');
const { getDb, isDbConfigured, initializeDatabase } = require('./mongodb');
const { setCache, getCache, invalidateCache } = require('./cache');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with permissive CORS for real-time live synchronization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket) => {
  // console.log('Socket client connected:', socket.id);
  socket.on('disconnect', () => {
    // console.log('Socket client disconnected:', socket.id);
  });
});

// Broadcast live change event to all connected clients & invalidate backend cache
const notifyDbChange = (type, payload = {}) => {
  try {
    io.emit('db_changed', { type, payload, timestamp: Date.now() });
  } catch (err) {
    console.warn('Socket emit error:', err.message);
  }
};

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to generate UUID strings
const genId = () => randomUUID();

// Helper to sanitize MongoDB document (strip _id if present or keep id)
const sanitizeDoc = (doc, excludeHeavy = false) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  const sanitized = {
    ...rest,
    id: rest.id || String(_id)
  };
  // Exclude massive base64 document attachments unless specifically requested
  if (excludeHeavy && sanitized.documents && Array.isArray(sanitized.documents)) {
    sanitized.documents = sanitized.documents.map(d => ({
      name: d.name || 'Document',
      size: d.size || null,
      type: d.type || null,
      uploaded_at: d.uploaded_at || null
    }));
  }
  return sanitized;
};

const sanitizeList = (docs, excludeHeavy = false) => (docs || []).map(d => sanitizeDoc(d, excludeHeavy));

// In-memory fallback datastores
let usersStore = [
  { id: '1', email: 'admin@saas.com', password_hash: 'admin123', full_name: 'Rajesh Sharma', role: 'admin', department: 'Executive', designation: 'Managing Director', joins_date: '2025-01-10', status: 'active', phone: '9876543210', documents: [{ name: 'Offer_Letter.pdf' }] },
  { id: '2', email: 'head@saas.com', password_hash: 'head123', full_name: 'Vikram Malhotra', role: 'project_head', department: 'Engineering', designation: 'Technical Architect', joins_date: '2025-03-15', status: 'active', phone: '9876543211', documents: [] },
  { id: '3', email: 'member@saas.com', password_hash: 'member123', full_name: 'Aravind Kumar', role: 'team_member', department: 'Engineering', designation: 'Senior Developer', joins_date: '2025-06-01', status: 'active', phone: '9876543212', documents: [] }
];

let clientsStore = [];
let projectsStore = [];
let tasksStore = [];
let deadlineRequestsStore = [];
let reportsStore = [];
let projectHistoryStore = [];
let attendanceStore = [];
let leavesStore = [];
let notificationsStore = [];

// Helper for notifications
const createNotification = async (userId, title, message) => {
  if (!userId) return;
  const notif = {
    id: genId(),
    user_id: String(userId),
    title,
    message,
    is_read: false,
    created_at: new Date().toISOString()
  };

  invalidateCache(`notifications:${userId}`);
  notifyDbChange('notification', { userId, notif });

  const db = getDb();
  if (db) {
    try {
      await db.collection('notifications').insertOne(notif);
      return;
    } catch (e) {
      console.warn('MongoDB notification insert failed, pushing to memory:', e.message);
    }
  }
  notificationsStore.push(notif);
};

// ==========================================
// ROUTES
// ==========================================

// Auth API
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  if (db) {
    try {
      const user = await db.collection('users').findOne({ email, password_hash: password });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      return res.json({ user: sanitizeDoc(user) });
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
  const includeFullDocs = req.query.full === 'true';
  const cacheKey = includeFullDocs ? 'users:all:full' : 'users:all';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const db = getDb();
  if (db) {
    try {
      const docs = await db.collection('users').find({}).sort({ created_at: -1 }).toArray();
      const result = sanitizeList(docs, !includeFullDocs);
      setCache(cacheKey, result);
      return res.json(result);
    } catch (err) {
      console.warn('MongoDB fetch users error:', err.message);
    }
  }
  res.json(usersStore);
});

app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const includeFull = req.query.full !== 'false'; // single user query includes documents by default for detail view
  const cacheKey = `users:${id}:${includeFull ? 'full' : 'slim'}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const db = getDb();
  if (db) {
    try {
      const doc = await db.collection('users').findOne({ id: String(id) });
      if (doc) {
        const result = sanitizeDoc(doc, !includeFull);
        setCache(cacheKey, result);
        return res.json(result);
      }
    } catch (err) {
      console.warn('MongoDB get user error:', err.message);
    }
  }
  const memUser = usersStore.find(u => String(u.id) === String(id));
  if (memUser) return res.json(memUser);
  res.status(404).json({ error: 'User not found' });
});

app.post('/api/users', async (req, res) => {
  const { email, password_hash, full_name, role, department, designation, phone, joins_date, status, documents, employment_type, dob, gender, address } = req.body;
  const newUser = {
    id: genId(),
    email,
    password_hash: password_hash || 'password123',
    full_name,
    role,
    department: department || 'Engineering',
    designation: designation || 'Staff Member',
    phone: phone || '',
    joins_date: joins_date || new Date().toISOString().split('T')[0],
    status: status || 'active',
    documents: documents || [],
    employment_type: employment_type || 'on role',
    dob: dob || null,
    gender: gender || null,
    address: address || null,
    created_at: new Date().toISOString()
  };

  invalidateCache('users', 'timesheets');
  notifyDbChange('users', { action: 'create' });

  const db = getDb();
  if (db) {
    try {
      await db.collection('users').insertOne(newUser);
      return res.status(201).json(sanitizeDoc(newUser));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  usersStore.unshift(newUser);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  delete updates._id;
  delete updates.id;

  invalidateCache('users', 'timesheets');
  notifyDbChange('users', { action: 'create' });

  const db = getDb();
  if (db) {
    try {
      const result = await db.collection('users').findOneAndUpdate(
        { id: String(id) },
        { $set: updates },
        { returnDocument: 'after' }
      );
      if (result) return res.json(sanitizeDoc(result));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const idx = usersStore.findIndex(u => String(u.id) === String(id));
  if (idx !== -1) {
    usersStore[idx] = { ...usersStore[idx], ...updates };
    return res.json(usersStore[idx]);
  }
  res.status(404).json({ error: 'User not found' });
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  invalidateCache('users', 'timesheets');
  notifyDbChange('users', { action: 'create' });

  const db = getDb();
  if (db) {
    try {
      await db.collection('users').deleteOne({ id: String(id) });
      return res.json({ message: 'User deleted successfully' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  usersStore = usersStore.filter(u => String(u.id) !== String(id));
  res.json({ message: 'User deleted successfully' });
});

// Clients API
app.get('/api/clients', async (req, res) => {
  const cached = getCache('clients:all');
  if (cached) return res.json(cached);

  const db = getDb();
  if (db) {
    try {
      const docs = await db.collection('clients').find({}).sort({ created_at: -1 }).toArray();
      const result = sanitizeList(docs);
      setCache('clients:all', result);
      return res.json(result);
    } catch (err) {
      console.warn('MongoDB get clients error:', err.message);
    }
  }
  res.json(clientsStore);
});

app.post('/api/clients', async (req, res) => {
  const { name, email, phone, company, status, follow_up_notes } = req.body;
  const newClient = {
    id: genId(),
    name,
    email,
    phone: phone || '',
    company: company || '',
    status: status || 'initiated',
    follow_up_notes: follow_up_notes || [],
    onboarded_at: (status === 'onboarded' || status === 'onboard') ? new Date().toISOString() : null,
    created_at: new Date().toISOString()
  };

  invalidateCache('clients', 'projects');
  notifyDbChange('clients', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      await db.collection('clients').insertOne(newClient);
      return res.status(201).json(sanitizeDoc(newClient));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  clientsStore.unshift(newClient);
  res.status(201).json(newClient);
});

app.put('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  delete updates._id;
  delete updates.id;

  if (updates.status === 'onboarded' || updates.status === 'onboard') {
    updates.onboarded_at = updates.onboarded_at || new Date().toISOString();
  }

  invalidateCache('clients', 'projects');
  notifyDbChange('clients', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      const result = await db.collection('clients').findOneAndUpdate(
        { id: String(id) },
        { $set: updates },
        { returnDocument: 'after' }
      );
      if (result) return res.json(sanitizeDoc(result));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const idx = clientsStore.findIndex(c => String(c.id) === String(id));
  if (idx !== -1) {
    clientsStore[idx] = { ...clientsStore[idx], ...updates };
    return res.json(clientsStore[idx]);
  }
  res.status(404).json({ error: 'Client not found' });
});

app.delete('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  invalidateCache('clients', 'projects');
  notifyDbChange('clients', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      await db.collection('clients').deleteOne({ id: String(id) });
      return res.json({ message: 'Client deleted successfully' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  clientsStore = clientsStore.filter(c => String(c.id) !== String(id));
  res.json({ message: 'Client deleted successfully' });
});

// Projects API
app.get('/api/projects', async (req, res) => {
  const cached = getCache('projects:all');
  if (cached) return res.json(cached);

  const db = getDb();
  if (db) {
    try {
      const [projects, clients, users] = await Promise.all([
        db.collection('projects').find({}).sort({ created_at: -1 }).toArray(),
        db.collection('clients').find({}).toArray(),
        db.collection('users').find({}).toArray()
      ]);

      const clientMap = new Map(clients.map(c => [String(c.id), c]));
      const userMap = new Map(users.map(u => [String(u.id), u]));

      const enriched = projects.map(p => {
        const client = clientMap.get(String(p.client_id));
        const head = userMap.get(String(p.project_head_id));
        return {
          ...sanitizeDoc(p),
          client_name: client ? client.name : null,
          client_company: client ? client.company : null,
          project_head_name: head ? head.full_name : null,
          project_head_email: head ? head.email : null
        };
      });

      setCache('projects:all', enriched);
      return res.json(enriched);
    } catch (err) {
      console.warn('MongoDB get projects error:', err.message);
    }
  }

  const enriched = projectsStore.map(p => {
    const client = clientsStore.find(c => String(c.id) === String(p.client_id));
    const head = usersStore.find(u => String(u.id) === String(p.project_head_id));
    return {
      ...p,
      client_name: client ? client.name : null,
      client_company: client ? client.company : null,
      project_head_name: head ? head.full_name : null,
      project_head_email: head ? head.email : null
    };
  });
  res.json(enriched);
});

app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `projects:${id}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const db = getDb();
  if (db) {
    try {
      const project = await db.collection('projects').findOne({ id: String(id) });
      if (project) {
        const [client, head] = await Promise.all([
          project.client_id ? db.collection('clients').findOne({ id: String(project.client_id) }) : null,
          project.project_head_id ? db.collection('users').findOne({ id: String(project.project_head_id) }) : null
        ]);
        const result = {
          ...sanitizeDoc(project),
          client_name: client ? client.name : null,
          client_company: client ? client.company : null,
          project_head_name: head ? head.full_name : null,
          project_head_email: head ? head.email : null
        };
        setCache(cacheKey, result);
        return res.json(result);
      }
    } catch (err) {
      console.warn('MongoDB get project error:', err.message);
    }
  }

  const p = projectsStore.find(x => String(x.id) === String(id));
  if (!p) return res.status(404).json({ error: 'Project not found' });
  const client = clientsStore.find(c => String(c.id) === String(p.client_id));
  const head = usersStore.find(u => String(u.id) === String(p.project_head_id));
  res.json({
    ...p,
    client_name: client ? client.name : null,
    client_company: client ? client.company : null,
    project_head_name: head ? head.full_name : null,
    project_head_email: head ? head.email : null
  });
});

app.post('/api/projects', async (req, res) => {
  const { name, client_id, description, status, start_date, end_date, budget, project_head_id } = req.body;
  const newProject = {
    id: genId(),
    name,
    client_id: client_id ? String(client_id) : null,
    description: description || '',
    status: status || 'active',
    start_date: start_date || null,
    end_date: end_date || null,
    budget: budget ? Number(budget) : 0,
    project_head_id: project_head_id ? String(project_head_id) : null,
    created_at: new Date().toISOString()
  };

  invalidateCache('projects');
  notifyDbChange('projects', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      await db.collection('projects').insertOne(newProject);
      await db.collection('project_history').insertOne({
        id: genId(),
        project_id: newProject.id,
        action: 'created',
        description: `Project created with budget of ₹${Number(newProject.budget).toLocaleString('en-IN')}`,
        performed_by: 'Admin',
        created_at: new Date().toISOString()
      });

      if (newProject.project_head_id) {
        await createNotification(
          newProject.project_head_id,
          'Assigned as Project Head',
          `You have been designated as the Project Head for workspace "${name}".`
        );
      }

      return res.status(201).json(sanitizeDoc(newProject));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  projectsStore.unshift(newProject);
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  delete updates._id;
  delete updates.id;
  if (updates.budget) updates.budget = Number(updates.budget);

  invalidateCache('projects');
  notifyDbChange('projects', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      const old = await db.collection('projects').findOne({ id: String(id) });
      const result = await db.collection('projects').findOneAndUpdate(
        { id: String(id) },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (result) {
        if (updates.budget && old && Number(old.budget) !== Number(updates.budget)) {
          await db.collection('project_history').insertOne({
            id: genId(),
            project_id: String(id),
            action: 'budget_updated',
            description: `Budget modified from ₹${Number(old.budget).toLocaleString('en-IN')} to ₹${Number(updates.budget).toLocaleString('en-IN')}`,
            performed_by: 'Admin',
            created_at: new Date().toISOString()
          });
        }

        if (updates.project_head_id && old && String(old.project_head_id) !== String(updates.project_head_id)) {
          await createNotification(
            updates.project_head_id,
            'Project Head Handover',
            `You are now assigned as the Project Head for project "${result.name}".`
          );
        }

        return res.json(sanitizeDoc(result));
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const idx = projectsStore.findIndex(p => String(p.id) === String(id));
  if (idx !== -1) {
    projectsStore[idx] = { ...projectsStore[idx], ...updates };
    return res.json(projectsStore[idx]);
  }
  res.status(404).json({ error: 'Project not found' });
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  invalidateCache('projects', 'tasks');
  notifyDbChange('projects', { action: 'delete' });
  notifyDbChange('tasks', { action: 'delete' });

  const db = getDb();
  if (db) {
    try {
      await Promise.all([
        db.collection('projects').deleteOne({ id: String(id) }),
        db.collection('tasks').deleteMany({ project_id: String(id) }),
        db.collection('project_history').deleteMany({ project_id: String(id) })
      ]);
      return res.json({ message: 'Project and associated tasks deleted successfully' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  projectsStore = projectsStore.filter(p => String(p.id) !== String(id));
  tasksStore = tasksStore.filter(t => String(t.project_id) !== String(id));
  res.json({ message: 'Project deleted' });
});

app.get('/api/projects/:id/history', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `history:${id}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const db = getDb();
  if (db) {
    try {
      const docs = await db.collection('project_history').find({ project_id: String(id) }).sort({ created_at: -1 }).toArray();
      const result = sanitizeList(docs);
      setCache(cacheKey, result);
      return res.json(result);
    } catch (err) {
      console.warn('MongoDB get history error:', err.message);
    }
  }

  const list = projectHistoryStore.filter(h => String(h.project_id) === String(id));
  res.json(list);
});

// Tasks API
app.get('/api/tasks', async (req, res) => {
  const { project_id, assigned_to } = req.query;
  const cacheKey = `tasks:${project_id || 'all'}:${assigned_to || 'all'}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const filter = {};
  if (project_id) filter.project_id = String(project_id);
  if (assigned_to) filter.assigned_to = String(assigned_to);

  const db = getDb();
  if (db) {
    try {
      const [tasks, projects, users] = await Promise.all([
        db.collection('tasks').find(filter).sort({ created_at: -1 }).toArray(),
        db.collection('projects').find({}).toArray(),
        db.collection('users').find({}).toArray()
      ]);

      const projMap = new Map(projects.map(p => [String(p.id), p]));
      const userMap = new Map(users.map(u => [String(u.id), u]));

      const enriched = tasks.map(t => {
        const proj = projMap.get(String(t.project_id));
        const user = userMap.get(String(t.assigned_to));
        return {
          ...sanitizeDoc(t),
          project: proj ? { name: proj.name, id: proj.id } : null,
          assigned_user: user ? { full_name: user.full_name, email: user.email, id: user.id } : null
        };
      });

      setCache(cacheKey, enriched);
      return res.json(enriched);
    } catch (err) {
      console.warn('MongoDB get tasks error:', err.message);
    }
  }

  let list = tasksStore;
  if (project_id) list = list.filter(t => String(t.project_id) === String(project_id));
  if (assigned_to) list = list.filter(t => String(t.assigned_to) === String(assigned_to));

  const enriched = list.map(t => {
    const proj = projectsStore.find(p => String(p.id) === String(t.project_id));
    const user = usersStore.find(u => String(u.id) === String(t.assigned_to));
    return {
      ...t,
      project: proj ? { name: proj.name, id: proj.id } : null,
      assigned_user: user ? { full_name: user.full_name, email: user.email, id: user.id } : null
    };
  });
  res.json(enriched);
});

app.post('/api/tasks', async (req, res) => {
  const { project_id, title, description, assigned_to, status, start_date, end_date } = req.body;
  const newTask = {
    id: genId(),
    project_id: String(project_id),
    title,
    description: description || '',
    assigned_to: assigned_to ? String(assigned_to) : null,
    status: status || 'todo',
    start_date: start_date || null,
    end_date: end_date || null,
    created_at: new Date().toISOString()
  };

  invalidateCache('tasks', 'timesheets');
  notifyDbChange('tasks', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      await db.collection('tasks').insertOne(newTask);

      if (newTask.assigned_to) {
        await createNotification(
          newTask.assigned_to,
          'New Task Assigned',
          `You have been assigned to task: "${title}".`
        );
      }

      return res.status(201).json(sanitizeDoc(newTask));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  tasksStore.unshift(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  delete updates._id;
  delete updates.id;

  invalidateCache('tasks', 'timesheets');
  notifyDbChange('tasks', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      const old = await db.collection('tasks').findOne({ id: String(id) });
      const result = await db.collection('tasks').findOneAndUpdate(
        { id: String(id) },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (result) {
        if (updates.assigned_to && old && String(old.assigned_to) !== String(updates.assigned_to)) {
          await createNotification(
            updates.assigned_to,
            'Task Reassigned',
            `You have been assigned to task "${result.title}".`
          );
        }
        if (updates.status && old && old.status !== updates.status) {
          if (result.assigned_to) {
            await createNotification(
              result.assigned_to,
              'Task Status Updated',
              `Task "${result.title}" status changed to ${updates.status}.`
            );
          }
        }
        return res.json(sanitizeDoc(result));
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const idx = tasksStore.findIndex(t => String(t.id) === String(id));
  if (idx !== -1) {
    tasksStore[idx] = { ...tasksStore[idx], ...updates };
    return res.json(tasksStore[idx]);
  }
  res.status(404).json({ error: 'Task not found' });
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  invalidateCache('tasks', 'reports', 'timesheets');
  notifyDbChange('tasks', { action: 'delete' });
  notifyDbChange('reports', { action: 'delete' });

  const db = getDb();
  if (db) {
    try {
      await Promise.all([
        db.collection('tasks').deleteOne({ id: String(id) }),
        db.collection('reports').deleteMany({ task_id: String(id) }),
        db.collection('deadline_requests').deleteMany({ task_id: String(id) })
      ]);
      return res.json({ message: 'Task deleted successfully' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  tasksStore = tasksStore.filter(t => String(t.id) !== String(id));
  res.json({ message: 'Task deleted' });
});

// Deadline Extension Requests
app.get('/api/deadline-requests', async (req, res) => {
  const cached = getCache('deadline_requests:all');
  if (cached) return res.json(cached);

  const db = getDb();
  if (db) {
    try {
      const [reqs, tasks, users] = await Promise.all([
        db.collection('deadline_requests').find({}).sort({ created_at: -1 }).toArray(),
        db.collection('tasks').find({}).toArray(),
        db.collection('users').find({}).toArray()
      ]);

      const taskMap = new Map(tasks.map(t => [String(t.id), t]));
      const userMap = new Map(users.map(u => [String(u.id), u]));

      const enriched = reqs.map(r => {
        const t = taskMap.get(String(r.task_id));
        const u = userMap.get(String(r.requested_by));
        return {
          ...sanitizeDoc(r),
          task: t ? { title: t.title, id: t.id } : null,
          user: u ? { full_name: u.full_name, email: u.email } : null
        };
      });

      setCache('deadline_requests:all', enriched);
      return res.json(enriched);
    } catch (err) {
      console.warn('MongoDB get deadline requests error:', err.message);
    }
  }

  res.json(deadlineRequestsStore);
});

app.post('/api/deadline-requests', async (req, res) => {
  const { task_id, requested_by, requested_date, reason } = req.body;
  const newReq = {
    id: genId(),
    task_id: String(task_id),
    requested_by: String(requested_by),
    requested_date,
    reason,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  invalidateCache('deadline_requests');
  notifyDbChange('deadline_requests', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      await db.collection('deadline_requests').insertOne(newReq);

      const task = await db.collection('tasks').findOne({ id: String(task_id) });
      if (task) {
        const project = await db.collection('projects').findOne({ id: String(task.project_id) });
        if (project && project.project_head_id) {
          await createNotification(
            project.project_head_id,
            'Deadline Extension Request',
            `A deadline change was requested for task "${task.title}".`
          );
        }
      }

      return res.status(201).json(sanitizeDoc(newReq));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  deadlineRequestsStore.unshift(newReq);
  res.status(201).json(newReq);
});

app.put('/api/deadline-requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  invalidateCache('deadline_requests', 'tasks');
  notifyDbChange('deadline_requests', { action: 'change' });
  notifyDbChange('tasks', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      const result = await db.collection('deadline_requests').findOneAndUpdate(
        { id: String(id) },
        { $set: { status } },
        { returnDocument: 'after' }
      );

      if (result) {
        if (status === 'approved') {
          await db.collection('tasks').updateOne(
            { id: String(result.task_id) },
            { $set: { end_date: result.requested_date } }
          );
        }
        await createNotification(
          result.requested_by,
          `Deadline Request ${status.toUpperCase()}`,
          `Your extension request for task has been ${status}.`
        );
        return res.json(sanitizeDoc(result));
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const idx = deadlineRequestsStore.findIndex(d => String(d.id) === String(id));
  if (idx !== -1) {
    deadlineRequestsStore[idx].status = status;
    return res.json(deadlineRequestsStore[idx]);
  }
  res.status(404).json({ error: 'Request not found' });
});

// Daily Work Reports / Hours Logging
app.get('/api/reports', async (req, res) => {
  const { task_id, submitted_by } = req.query;
  const cacheKey = `reports:${task_id || 'all'}:${submitted_by || 'all'}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const filter = {};
  if (task_id) filter.task_id = String(task_id);
  if (submitted_by) filter.submitted_by = String(submitted_by);

  const db = getDb();
  if (db) {
    try {
      const [reports, tasks, users] = await Promise.all([
        db.collection('reports').find(filter).sort({ created_at: -1 }).toArray(),
        db.collection('tasks').find({}).toArray(),
        db.collection('users').find({}).toArray()
      ]);

      const taskMap = new Map(tasks.map(t => [String(t.id), t]));
      const userMap = new Map(users.map(u => [String(u.id), u]));

      const enriched = reports.map(r => {
        const t = taskMap.get(String(r.task_id));
        const u = userMap.get(String(r.submitted_by));
        return {
          ...sanitizeDoc(r),
          task: t ? { title: t.title, id: t.id } : null,
          user: u ? { full_name: u.full_name, email: u.email } : null
        };
      });

      setCache(cacheKey, enriched);
      return res.json(enriched);
    } catch (err) {
      console.warn('MongoDB get reports error:', err.message);
    }
  }

  res.json(reportsStore);
});

app.post('/api/reports', async (req, res) => {
  const { task_id, submitted_by, content, hours_spent, progress, status } = req.body;
  const newReport = {
    id: genId(),
    task_id: String(task_id),
    submitted_by: String(submitted_by),
    content,
    hours_spent: Number(hours_spent) || 0,
    progress: progress !== undefined ? Number(progress) : 0,
    status: status || 'submitted',
    created_at: new Date().toISOString()
  };

  invalidateCache('reports', 'tasks', 'timesheets');
  notifyDbChange('reports', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      await db.collection('reports').insertOne(newReport);

      if (progress !== undefined) {
        await db.collection('tasks').updateOne(
          { id: String(task_id) },
          { $set: { progress: Number(progress) } }
        );
      }

      const task = await db.collection('tasks').findOne({ id: String(task_id) });
      if (task) {
        const project = await db.collection('projects').findOne({ id: String(task.project_id) });
        if (project && project.project_head_id) {
          await createNotification(
            project.project_head_id,
            'Daily Report Logged',
            `Work update logged for task "${task.title}": ${hours_spent} hours.`
          );
        }
      }

      return res.status(201).json(sanitizeDoc(newReport));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  reportsStore.unshift(newReport);
  res.status(201).json(newReport);
});

app.put('/api/reports/:id', async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  delete updates._id;
  delete updates.id;

  invalidateCache('reports', 'timesheets');

  const db = getDb();
  if (db) {
    try {
      const result = await db.collection('reports').findOneAndUpdate(
        { id: String(id) },
        { $set: updates },
        { returnDocument: 'after' }
      );
      if (result) return res.json(sanitizeDoc(result));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const idx = reportsStore.findIndex(r => String(r.id) === String(id));
  if (idx !== -1) {
    reportsStore[idx] = { ...reportsStore[idx], ...updates };
    return res.json(reportsStore[idx]);
  }
  res.status(404).json({ error: 'Report not found' });
});

// Notifications API
app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  const cacheKey = `notifications:${userId}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const db = getDb();
  if (db) {
    try {
      const docs = await db.collection('notifications')
        .find({ user_id: String(userId) })
        .sort({ created_at: -1 })
        .limit(25)
        .toArray();
      const result = sanitizeList(docs);
      setCache(cacheKey, result, 15000); // 15s cache
      return res.json(result);
    } catch (err) {
      console.warn('MongoDB get notifications error:', err.message);
    }
  }

  const userNotifs = notificationsStore
    .filter(n => String(n.user_id) === String(userId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(userNotifs);
});

app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  invalidateCache('notifications');

  const db = getDb();
  if (db) {
    try {
      await db.collection('notifications').updateOne(
        { id: String(id) },
        { $set: { is_read: true } }
      );
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const notif = notificationsStore.find(n => String(n.id) === String(id));
  if (notif) notif.is_read = true;
  res.json({ success: true });
});

// Attendance API
app.get('/api/attendance', async (req, res) => {
  const { user_id, date, start_date, end_date } = req.query;
  const cacheKey = `attendance:${user_id || 'all'}:${date || 'all'}:${start_date || ''}:${end_date || ''}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const filter = {};
  if (user_id) filter.user_id = String(user_id);
  if (date) filter.date = date;
  if (start_date && end_date) {
    filter.date = { $gte: start_date, $lte: end_date };
  }

  const db = getDb();
  if (db) {
    try {
      const [attendances, users] = await Promise.all([
        db.collection('attendance').find(filter).sort({ date: -1 }).toArray(),
        db.collection('users').find({}).toArray()
      ]);

      const userMap = new Map(users.map(u => [String(u.id), u]));
      const enriched = attendances.map(a => {
        const u = userMap.get(String(a.user_id));
        return {
          ...sanitizeDoc(a),
          user: u ? { full_name: u.full_name, email: u.email, department: u.department, designation: u.designation } : null
        };
      });

      setCache(cacheKey, enriched, 30000);
      return res.json(enriched);
    } catch (err) {
      console.warn('MongoDB get attendance error:', err.message);
    }
  }

  res.json(attendanceStore);
});

app.post('/api/attendance', async (req, res) => {
  const { user_id, date, status, check_in, check_out, morning_in, morning_out, afternoon_in, afternoon_out, work_mode, notes } = req.body;
  invalidateCache('attendance', 'timesheets');
  notifyDbChange('attendance', { action: 'change' });

  const query = { user_id: String(user_id), date };
  const updateDoc = {
    status: status || 'present',
    check_in: check_in || null,
    check_out: check_out || null,
    morning_in: morning_in || null,
    morning_out: morning_out || null,
    afternoon_in: afternoon_in || null,
    afternoon_out: afternoon_out || null,
    work_mode: work_mode || 'office',
    notes: notes || '',
    updated_at: new Date().toISOString()
  };

  const db = getDb();
  if (db) {
    try {
      const result = await db.collection('attendance').findOneAndUpdate(
        query,
        {
          $set: updateDoc,
          $setOnInsert: { id: genId(), user_id: String(user_id), date, created_at: new Date().toISOString() }
        },
        { upsert: true, returnDocument: 'after' }
      );
      return res.json(sanitizeDoc(result));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const idx = attendanceStore.findIndex(a => String(a.user_id) === String(user_id) && a.date === date);
  if (idx !== -1) {
    attendanceStore[idx] = { ...attendanceStore[idx], ...updateDoc };
    return res.json(attendanceStore[idx]);
  } else {
    const item = { id: genId(), user_id: String(user_id), date, ...updateDoc, created_at: new Date().toISOString() };
    attendanceStore.unshift(item);
    return res.json(item);
  }
});

// Leaves & Permissions API
app.get('/api/leaves', async (req, res) => {
  const { user_id, status } = req.query;
  const cacheKey = `leaves:${user_id || 'all'}:${status || 'all'}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const filter = {};
  if (user_id) filter.user_id = String(user_id);
  if (status) filter.status = status;

  const db = getDb();
  if (db) {
    try {
      const [leaves, users] = await Promise.all([
        db.collection('leaves').find(filter).sort({ created_at: -1 }).toArray(),
        db.collection('users').find({}).toArray()
      ]);

      const userMap = new Map(users.map(u => [String(u.id), u]));
      const enriched = leaves.map(l => {
        const applicant = userMap.get(String(l.user_id));
        const reviewer = l.reviewed_by ? userMap.get(String(l.reviewed_by)) : null;
        return {
          ...sanitizeDoc(l),
          user: applicant ? { full_name: applicant.full_name, email: applicant.email, department: applicant.department } : null,
          reviewer: reviewer ? { full_name: reviewer.full_name } : null
        };
      });

      setCache(cacheKey, enriched, 30000);
      return res.json(enriched);
    } catch (err) {
      console.warn('MongoDB get leaves error:', err.message);
    }
  }

  res.json(leavesStore);
});

app.post('/api/leaves', async (req, res) => {
  const { user_id, leave_type, start_date, end_date, days, reason } = req.body;
  const newLeave = {
    id: genId(),
    user_id: String(user_id),
    leave_type: leave_type || 'casual',
    start_date,
    end_date,
    days: Number(days) || 1,
    reason,
    status: 'pending',
    reviewed_by: null,
    created_at: new Date().toISOString()
  };

  invalidateCache('leaves', 'timesheets');
  notifyDbChange('leaves', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      await db.collection('leaves').insertOne(newLeave);

      const admins = await db.collection('users').find({ role: 'admin' }).toArray();
      const applicant = await db.collection('users').findOne({ id: String(user_id) });
      const name = applicant ? applicant.full_name : 'An employee';
      for (const admin of admins) {
        await createNotification(
          admin.id,
          'New Leave Application',
          `${name} applied for ${newLeave.days} day(s) ${leave_type} leave.`
        );
      }

      return res.status(201).json(sanitizeDoc(newLeave));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  leavesStore.unshift(newLeave);
  res.status(201).json(newLeave);
});

app.put('/api/leaves/:id', async (req, res) => {
  const { id } = req.params;
  const { status, reviewed_by, review_remarks } = req.body;

  invalidateCache('leaves', 'timesheets');
  notifyDbChange('leaves', { action: 'change' });

  const db = getDb();
  if (db) {
    try {
      const result = await db.collection('leaves').findOneAndUpdate(
        { id: String(id) },
        {
          $set: {
            status,
            reviewed_by: reviewed_by ? String(reviewed_by) : null,
            review_remarks: review_remarks || null,
            reviewed_at: new Date().toISOString()
          }
        },
        { returnDocument: 'after' }
      );

      if (result) {
        await createNotification(
          result.user_id,
          `Leave Request ${status.toUpperCase()}`,
          `Your ${result.leave_type} leave application has been ${status}.`
        );
        return res.json(sanitizeDoc(result));
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const idx = leavesStore.findIndex(l => String(l.id) === String(id));
  if (idx !== -1) {
    leavesStore[idx].status = status;
    leavesStore[idx].reviewed_by = reviewed_by;
    return res.json(leavesStore[idx]);
  }
  res.status(404).json({ error: 'Leave request not found' });
});

// Timesheets & Personnel Summary
app.get('/api/timesheets/summary', async (req, res) => {
  const cached = getCache('timesheets:summary');
  if (cached) return res.json(cached);

  const db = getDb();
  if (db) {
    try {
      const [users, reports, tasks, attendances, leaves] = await Promise.all([
        db.collection('users').find({}).toArray(),
        db.collection('reports').find({}).toArray(),
        db.collection('tasks').find({}).toArray(),
        db.collection('attendance').find({}).toArray(),
        db.collection('leaves').find({}).toArray()
      ]);

      const summary = users.map(user => {
        const uId = String(user.id);
        const userReports = reports.filter(r => String(r.submitted_by) === uId);
        const totalHours = userReports.reduce((sum, r) => sum + Number(r.hours_spent || 0), 0);

        const userTasks = tasks.filter(t => String(t.assigned_to) === uId);
        const completedTasksCount = userTasks.filter(t => t.status === 'completed').length;

        const userAttendance = attendances.filter(a => String(a.user_id) === uId);
        const daysPresent = userAttendance.filter(a => a.status === 'present').length;

        const userLeaves = leaves.filter(l => String(l.user_id) === uId && l.status === 'approved');
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

      setCache('timesheets:summary', summary, 30000);
      return res.json(summary);
    } catch (err) {
      console.warn('MongoDB timesheets summary error:', err.message);
    }
  }

  res.json([]);
});

// Status check API
app.get('/api/status', (req, res) => {
  const db = getDb();
  res.json({
    dbConnected: Boolean(db),
    mode: db ? 'Production MongoDB Atlas' : 'In-Memory Fallback Sandbox',
    database: 'nextask'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Backend server + WebSocket running on port ${PORT}`);
  if (isDbConfigured) {
    try {
      await initializeDatabase();
      // Pre-warm the cache immediately so first page loads take < 5ms
      const db = getDb();
      if (db) {
        console.log('Pre-warming cache for projects, clients, and users...');
        const [projects, clients, users] = await Promise.all([
          db.collection('projects').find({}).sort({ created_at: -1 }).toArray(),
          db.collection('clients').find({}).sort({ created_at: -1 }).toArray(),
          db.collection('users').find({}).sort({ created_at: -1 }).toArray()
        ]);
        setCache('projects:all', sanitizeList(projects));
        setCache('clients:all', sanitizeList(clients));
        setCache('users:all', sanitizeList(users, true));
        setCache('users:all:full', sanitizeList(users, false));
        console.log('Cache pre-warmed successfully.');
      }
    } catch (e) {
      console.warn('Database initialization failed, continuing with in-memory fallback:', e.message || e);
    }
  }
});
